import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../../src/modules/core';
import { CoreConfig, RoleDoc } from '../../../../src/modules/core/types';
import dataModule, {
  createOptions,
  getDatabase,
} from '../../../../src/modules/data';
import itemModule from '../../../../src/modules/items';
import { ItemType, SiteRoleDoc } from '../../../../src/modules/items/types';
import { fieldHashModule } from '../../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../../src/system';
import { createSiteSetupModule } from '../utils';
import { sqliteConfig } from '../../../utils/config';

describe('modules:items:role:cache', () => {
  test('web paths - basic test', async () => {
    const testRole: RoleDoc = {
      schema: {
        w: true,
        d: true,
      },
    };
    const testSiteRoleDoc: SiteRoleDoc = {
      default: true,
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
        createSiteSetupModule([{
          name: 'test',
          displayName: 'Test',
          default: true,
          sitePath: "/localhost",
          roles: {
            test: testSiteRoleDoc,
          },
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
        }])
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

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const siteRoles = await role.getSiteRoles(createOptions(context, {
      where: {
        doc: {
          default: true,
        },
      }
    }));
    expect(siteRoles).toBeDefined();
    expect(siteRoles).toHaveLength(1);
    const siteRole = siteRoles[0]

    expect(siteRole?.cacheDoc).toBeDefined();
    expect(siteRole?.cacheDoc?.web).toBeDefined();
    // expect(siteRole?.cacheDoc?.web?.hostnames).toBeDefined();
    // expect(siteRole?.cacheDoc?.web?.hostnames["localhost.com"]).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths['/']).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths['/sub']).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths['/sub/sub']).toBeDefined();
    // expect(Object.keys(rs?.doc?.data?.items)).toHaveLength(4);
    await core.shutdown();
  });
  test('web paths - dynamic test', async () => {
    const testRole: RoleDoc = {
      schema: {
        w: true,
        d: true,
      },
    };
    const testSiteRoleDoc: SiteRoleDoc = {
      default: true,
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
        createSiteSetupModule([{
          name: 'test',
          displayName: 'Test',
          default: true,
          sitePath: "/localhost", // ??
          roles: {
            test: testSiteRoleDoc,
          },
          items: [
            {
              name: 'localhost',
              type: ItemType.Folder,
              data: {
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
        }])
      ],
      clone: true,
      roles: {
        test: testRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: sqliteConfig
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

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const siteRoles = await role.getSiteRoles(createOptions(context, {
      where: {
        doc: {
          default: true,
        },
      }
    }));
    expect(siteRoles).toBeDefined();
    expect(siteRoles).toHaveLength(1);
    const siteRole = siteRoles[0]
    expect(siteRole?.cacheDoc).toBeDefined();
    expect(siteRole?.cacheDoc?.web).toBeDefined();
    // expect(role?.cacheDoc?.web?.hostnames).toBeDefined();
    // expect(role?.cacheDoc?.web?.hostnames["localhost.com"]).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths).toBeDefined();

    expect(siteRole?.cacheDoc?.web?.paths['/**/*']).toBeDefined();
    expect(siteRole?.cacheDoc?.web?.paths['/']).toBeUndefined()
    expect(siteRole?.cacheDoc?.web?.paths['/sub']).toBeUndefined();
    expect(siteRole?.cacheDoc?.web?.paths['/sub/sub']).toBeUndefined();
    // expect(Object.keys(rs?.doc?.data?.items)).toHaveLength(4);
    await core.shutdown();
  });
});
