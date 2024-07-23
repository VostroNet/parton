import { describe, expect } from '@jest/globals';

import { testIf } from '../../utils/test-if';
import coreModule from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import eventLogModule from '../../../src/modules/data/event-logs';
import { createContext, System } from '../../../src/system';
// import { startProfiling } from "../../utils/profiler";

import adminRole from './roles/admin';
import publicRole from './roles/public';

describe('modules:event-log', () => {
  testIf(process.env.DB_TYPE === "postgres", 'postgres - event log creation', async () => {
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, eventLogModule],
      clone: true,
      roles: {
        admin: adminRole,
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
      const db = await getDatabase(core);
      const context = await createContext(core, undefined, undefined, undefined, false);
      await db.models.Role.findAll(createOptions(context));
      throw new Error('should not get here');
    } catch (err: any) {
      expect(err.message).toBe('no role provided to validate find options');
    }
    await core.shutdown();
  });
});
