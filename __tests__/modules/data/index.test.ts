import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';
// import { startProfiling } from "../../utils/profiler";

import adminRole from './roles/admin';
import publicRole from './roles/public';

describe('modules:data', () => {
  // let profile: any;
  // beforeAll(() => {
  //   profile = startProfiling("index", "./.results/data/");
  // })
  // afterAll(async() => {
  //   try {
  //     await profile.stop();
  //   } catch (err: any) {
  //     console.log("err", err);
  //   }
  //   // await profile.stop();
  // });
  test('calling database model find without a role supplied', async () => {
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule],
      clone: true,
      roles: {
        admin: adminRole,
        public: publicRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      }
    };
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
      const db = await getDatabase(core);
      const context = await createContext(core, undefined, "system", false);
      await db.models.Role.findAll(createOptions(context));
      throw new Error('should not get here');
    } catch(err: any) {
      expect(err.message).toBe('no role provided to validate find options');
    }
    await core.shutdown();
  });
  test('calling database model find and providing the override flag', async () => {
    try {
      const config: CoreConfig = {
        name: 'data-test',
        slices: [dataModule, coreModule, roleUpsertModule, fieldHashModule],
        clone: true,
        roles: {
          admin: adminRole,
          public: publicRole,
        },
        data: {
          reset: true,
          sync: true,
          sequelize: {
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
          },
        }
      };
      const core = new System(config);
      await core.load();
      await core.initialize();
      await core.ready();
      const db = await getDatabase(core);
      const context = await createContext(core, undefined, undefined, true);
      const roles = await db.models.Role.findAll(createOptions(context));
      expect(roles.length).toBe(2);
      await core.shutdown();
    } catch(err: any) {
      console.log("err", err);
      expect(err).toBe(null)
    }
  });
});
