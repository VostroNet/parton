import { readFile } from 'fs/promises';
import path from 'path';

import { DependencyInfo } from '@vostro/sandwich';
import { kitchen } from '@vostro/sandwich';
import { glob } from 'glob';
import {  SequelizeStorage, Umzug } from 'umzug';

import { System } from '../system';
import { SystemEvent, SystemEvents } from '../types/events';
import { IModule } from '../types/system';

import { CoreConfig } from './core/types';
import {getDatabase } from './data';
import { MigratorContext } from './data/types';

export const migrationModule: IModule & SystemEvents = {
  name: 'migrator',
  dependencies: [{
    event: SystemEvent.Initialize,
    required: {
      before: ["data"]
    }
  }],
  [SystemEvent.Initialize]: async (system: System) => {
    const config = system.getConfig<CoreConfig>();
    if(!config.migrations) {
      system.logger.warn('No migration configuration found');
      return system;
    }
    
    const options = config.migrations;
    const db = await getDatabase(system);

    function getModule<T>(name: string) {
      return system.get<T>(name);
    }
    function moduleExists(name: string) {
      return !!system.get(name);
    }
    async function runQuery(moduleName: string, sql: string, options?: any) {
      if (moduleExists(moduleName)) {
        await db.query(sql, options);
      }
    }
    async function runQueryFile(
      moduleName: string,
      file: string,
      options?: any,
    ) {
      if (moduleExists(moduleName)) {
        const sql = await readFile(file, { encoding: 'utf-8' });
        try {
          await db.query(sql, options);
        } catch(err: any) {
          system.logger.error(err);
          throw err;
        }
      }
    }
    const storage = new SequelizeStorage({ sequelize: db });
    const alreadyComplete = await storage.executed();
    const migrationObj: any = {};
    alreadyComplete.forEach((name: any) => {
      migrationObj[name] = {
        name,
        up() {},
        down() {},
      };
    });

    const availableMigrations = await glob('**/*.{js,ts,up.sql}', {
      cwd: path.resolve(process.cwd(), options.path),
    });

    const sliceNames: string[] = [];
    let dependencyInfos: DependencyInfo[] = [];
    await Promise.all(
      availableMigrations.map(async (p: string) => {
        const target = path.resolve(options.path, p);
        const relative = path.relative(__dirname, target);
        const dirname = path.dirname(p);
        const basename = path.basename(p, path.extname(p));
        const name = path.join(dirname, basename);
        let m = await import(relative);
        if (m.default) {
          m = m.default;
        }
        sliceNames.push(name);
        const toast = await kitchen.buildToast(
          {
            name: m.name || name,
            dependencies: m.dependencies || [],
            up(...args: any[]) {
              if (options.fake) {
                return;
              }
              if (m.up) {
                return m.up(...args);
              }
            },
            upRollback: m.upRollback,
            down(...args: any[]) {
              if (options.fake) {
                return;
              }
              if (m.down) {
                return m.down(...args);
              }
            },
            downRollback: m.downRollback,
          },
          system,
          process.cwd(),
          0,
          false,
        );
        migrationObj[name] = toast;
        dependencyInfos = dependencyInfos.concat(toast.dependencyInfos);
      }),
    );

    const sortedSliceNames = await kitchen.sortArrayByDependencyInfo(
      sliceNames,
      dependencyInfos,
    );

    const migrationContext: MigratorContext = {
      options,
      sequelize: db,
      app: {
        system,
      },
      getModule,
      moduleExists,
      runQuery, 
      runQueryFile,
    };
    const umzug = new Umzug({
      storage,
      context: migrationContext,
      logger: system.logger as any,
      migrations: sortedSliceNames.map((name: string) => migrationObj[name]),
    });
    try {
      await umzug.up();
    } catch(err: any) {
      const {migration} = err;
      system.logger.error(`migration failed: ${migration.name}`, err, err.stack, migration);
      try {
        if (migrationObj[migration.name].upRollback) {
          system.logger.info(`Rolling back migration: ${migration.name}`);
          await migrationObj[migration.name].upRollback({context: migrationContext});
        }
      } catch(er: any) {
        system.logger.error(`rollback failed for migration: ${migration.name}`, er, er.stack, migration);
      }

    }
    return system;
  },
};

// getDependencyInfos
// sortArrayByDependencyInfo
