import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../../src/modules/core';
import { CoreConfig } from '../../../../src/modules/core/types';
import dataModule, {
  createOptions,
  getDatabase,
} from '../../../../src/modules/data';
import itemModule from '../../../../src/modules/items';
import { ItemType, RoleItemDoc } from '../../../../src/modules/items/types';
import { fieldHashModule } from '../../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../../src/system';
import { createSiteSetupModule } from '../utils';

describe('modules:items:role:cache', () => {
  test('web paths - basic test', async () => {
    const testRole: RoleItemDoc = {
      default: true,
      schema: {
        w: true,
        d: true,
      },
      items: {
        r: true,
        sets: [],
      },
    };
    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        createSiteSetupModule({
          name: 'test',
          displayName: 'Test',
          default: true,
          sitePath: "/localhost",
          items: [
            {
              name: 'localhost',
              type: ItemType.Folder,
              data: {
                hostnames: ['localhost.com'],
              },
              children: [
                {
                  name: 'sub',
                  type: ItemType.Folder,
                  children: [
                    {
                      name: 'sub',
                      type: ItemType.Folder,
                    },
                  ],
                },
              ],
            },
            {
              name: 'denied',
              type: ItemType.Folder,
            },
          ],
        })
      ],
      clone: true,
      roles: {
        test: testRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    expect(role?.cacheDoc).toBeDefined();
    expect(role?.cacheDoc?.web).toBeDefined();
    expect(role?.cacheDoc?.web?.hostnames).toBeDefined();
    expect(role?.cacheDoc?.web?.hostnames["localhost.com"]).toBeDefined();
    expect(role?.cacheDoc?.web?.paths).toBeDefined();

    expect(role?.cacheDoc?.web?.paths['localhost.com']).toBeDefined();
    expect(role?.cacheDoc?.web?.paths['localhost.com/sub']).toBeDefined();
    expect(role?.cacheDoc?.web?.paths['localhost.com/sub/sub']).toBeDefined();
    // expect(Object.keys(rs?.doc?.data?.items)).toHaveLength(4);
    await core.shutdown();
  });
  test('web paths - dynamic test', async () => {
    const testRole: RoleItemDoc = {
      default: true,
      schema: {
        w: true,
        d: true,
      },
      items: {
        r: true,
        sets: [],
      },
    };
    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        createSiteSetupModule({
          name: 'test',
          displayName: 'Test',
          default: true,
          sitePath: "/",
          items: [
            {
              name: 'localhost',
              type: ItemType.Folder,
              data: {
                hostnames: ['localhost.com'],
                dynamic: true
              },
              children: [
                {
                  name: 'sub',
                  type: ItemType.Folder,
                  children: [
                    {
                      name: 'sub',
                      type: ItemType.Folder,
                    },
                  ],
                },
              ],
            },
            {
              name: 'denied',
              type: ItemType.Folder,
            },
          ],
        })
      ],
      clone: true,
      roles: {
        test: testRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    expect(role?.cacheDoc).toBeDefined();
    expect(role?.cacheDoc?.web).toBeDefined();
    expect(role?.cacheDoc?.web?.hostnames).toBeDefined();
    expect(role?.cacheDoc?.web?.hostnames["localhost.com"]).toBeDefined();
    expect(role?.cacheDoc?.web?.paths).toBeDefined();

    expect(role?.cacheDoc?.web?.paths['localhost.com/**/*']).toBeDefined();
    expect(role?.cacheDoc?.web?.paths['localhost.com']).toBeUndefined()
    expect(role?.cacheDoc?.web?.paths['localhost.com/sub']).toBeUndefined();
    expect(role?.cacheDoc?.web?.paths['localhost.com/sub/sub']).toBeUndefined();
    // expect(Object.keys(rs?.doc?.data?.items)).toHaveLength(4);
    await core.shutdown();
  });
});
