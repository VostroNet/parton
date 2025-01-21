import { describe, expect } from '@jest/globals';

import { testIf } from '../../utils/test-if';
import coreModule from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { buildOptions, createOptions, getDatabase } from '../../../src/modules/data';
import {roleUpsertModule} from '../../../src/modules/utils/role-upsert';
import eventLogModule from '../../../src/modules/data/event-logs';
import { createContext, System } from '../../../src/system';
// import { startProfiling } from "../../utils/profiler";

import adminRole from './roles/admin';
import publicRole from './roles/public';
import DatabaseContext from '../../../src/types/models';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import Sequelize from 'sequelize';



describe('modules-event-log', () => {
  testIf(process.env.DB_TYPE === "postgres", 'postgres - event log creation', async () => {
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, eventLogModule, roleUpsertModule, fieldHashModule],
      clone: true,
      roles: {
        public: publicRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'postgres',
          host: 'postgres.local',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'local',
          schema: 'evntlog1',
          logging: false,
        },
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
      const db = await getDatabase<DatabaseContext>(core);
      // const {Role} = db.models;
      // const context = await createContext(core, undefined, undefined, undefined, true);
      // await Role.create({name: 'admin'}, createOptions(context));
      const results: any[] = await db.query('SELECT * FROM evntlog1.roles_log', {
        type: Sequelize.QueryTypes.SELECT,
      });
      expect(results.length).toBe(1);
      expect(results[0].rowId).toBe(1);
      expect(results[0].operation).toBe('INSERT');
      expect(results[0].data.name).toBe('public');
      expect(results[0].userId).toBe(-1);

    } catch (err: any) {
      expect(err).not.toBeDefined();
      throw err;
    }
    await core.shutdown();
  });
  testIf(process.env.DB_TYPE === "postgres", 'postgres - testing no user id trigger', async () => {
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, eventLogModule, roleUpsertModule, fieldHashModule],
      clone: true,
      // roles: {
      //   public: publicRole,
      // },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'postgres',
          host: 'postgres.local',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'local',
          schema: 'evntlog1',
          logging: false,
        },
      }
    };
    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();
    const db = await getDatabase<DatabaseContext>(core);
    const {Role} = db.models;
    const context = await createContext(core, undefined, undefined, undefined, true);
    context.user.id = "";
    let options = buildOptions<any>(context)
      
    try {
      await Role.create({name: 'fail'}, options);
      expect(true).not.toBe(true);
    } catch (err: any) {
      // console.log("err", err);
      expect(err.message).toBe("User id is required.");
    }
    // console.log("options", options);
    await core.shutdown();
  });
});
