import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../src/modules/core';
import dataModule, { getDatabase } from '../../../src/modules/data';
import { MigrationConfig, migrationModule } from '../../../src/modules/migration';
import { System } from '../../../src/system';
import DatabaseContext from '../../../src/types/models';


describe('modules:data:migrations', () => {
  test('testing with no migrations', async () => {
    const config: MigrationConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, migrationModule],
      clone: true,
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
      migrations: {
        fake: false,
        path: "./__tests__/modules/migration/data/empty"
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();

    } catch (err: any) {
      expect(err).toBeUndefined();
      // expect(err.message).toBe('no role provided to validate find options');
    }
    const db = await getDatabase<DatabaseContext>(core);
    const [results] = await db.query('SELECT * FROM "SequelizeMeta";') as { name: string }[][];
    expect(results).toHaveLength(0);
    await core.shutdown();
  });
  test('testing a basic migration', async () => {
    const config: MigrationConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, migrationModule],
      clone: true,
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
      migrations: {
        fake: false,
        path: "./__tests__/modules/migration/data/basic"
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();

    } catch (err: any) {
      expect(err).toBeUndefined();
      // expect(err.message).toBe('no role provided to validate find options');
    }
    const db = await getDatabase<DatabaseContext>(core);
    const [results] = await db.query('SELECT * FROM "SequelizeMeta";') as { name: string }[][];
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('test1/init');
    await core.shutdown();
  });
  test('testing a complex migration', async () => {
    const config: MigrationConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, migrationModule],
      clone: true,
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          // storage: './test.db',
          logging: false,
        },
      },
      migrations: {
        fake: false,
        path: "./__tests__/modules/migration/data/complex"
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();


      const db = await getDatabase<DatabaseContext>(core);
      const [results] = await db.query('SELECT * FROM "SequelizeMeta";') as { name: string }[][];
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('complex_test1');

      const [cmresults] = await db.query('SELECT * FROM "complex_table";') as { name: string }[][];
      // console.log("result", cmresults);
      expect(cmresults).toHaveLength(1);
      expect(cmresults[0].name).toBe('test');

      await core.shutdown();
    } catch (err: any) {
      expect(err?.stack).toBeUndefined();
      // expect(err.message).toBe('no role provided to validate find options');
    }
  });
  test('testing a failed migration', async () => {
    const config: MigrationConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, migrationModule],
      clone: true,
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
      migrations: {
        fake: false,
        path: "./__tests__/modules/migration/data/failure"
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
      expect(false).toBe(true);
    } catch (err: any) {

      //SELECT name FROM sqlite_master
      // expect(err).toBeUndefined();
      // expect(err.message).toBe('no role provided to validate find options');
    }

    const db = await getDatabase<DatabaseContext>(core);
    const [results] = await db.query('SELECT name FROM sqlite_master;') as { name: string }[][];
    expect(results.filter((row) => row.name === "complex_table")).toHaveLength(0);
    await core.shutdown();
  });
});
