import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
import { getPageFromSiteRoleWebCache, getPageResolver } from '../../../src/modules/items/logic/web';
import { Page } from '../../../src/modules/items/types';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';

import { createTestSite } from './utils';
import { databaseConfig } from '../../utils/config';
import { createContextFromRequest } from '../../../src/modules/express';

describe("modules:items:page", () => {
  test("getPageFromSiteRoleWebCache", async () => {
    const { siteModule, roles } = await createTestSite();
    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
      ],
      clone: true,
      roles: roles,
      data: {
        reset: true,
        sync: true,
        sequelize: databaseConfig
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
      createOptions(context, { where: { name: 'public' } }),
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
    const siteRole = siteRoles[0];

    // const pagePath = getPagePathFromUri('https://localhost.com:788/sub');
    const page: Page | undefined = await getPageFromSiteRoleWebCache(siteRole?.cacheDoc, "/sub", 1);
    expect(page).toBeDefined();
    expect(page?.layout).toBeDefined();
    expect(page?.layout?.path).toBe('/layouts/main');
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test')
    expect(page?.sublayouts).toBeDefined();
    expect(page?.props).toBeDefined();
    expect(page?.props?.title).toBe('Page');

    const pageItemId = siteRole?.cacheDoc?.web?.paths['/sub'];
    // const pageItem = role?.cacheDoc.data?.items[pageItemId];
    expect(page?.id).toBeDefined();
    expect(page?.id).toBe(pageItemId);
    expect(page?.values).toBeDefined();
    expect(page?.name).toBeDefined();
    expect(page?.name).toBe('sub');
    expect(page?.displayName).toBeDefined();
    expect(page?.displayName).toBe('Sub');
    expect(page?.webPath).toBeDefined();
    expect(page?.webPath).toBe('/sub');
    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(2);
    expect(Object.keys((page?.children || [])[0])).toHaveLength(9);
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test');
    expect(page?.sublayouts).toBeDefined();
    expect(page?.sublayouts).toHaveLength(2);
    expect(page?.sublayouts[0].path).toBe('/sublayouts/sub1');
    expect(page?.sublayouts[0].props).toBeDefined();
    expect(page?.sublayouts[0].props).toEqual({});
    expect(page?.sublayouts[1].path).toBe('/sublayouts/sub2');
    expect(page?.sublayouts[1].props).toBeDefined();
    expect(page?.sublayouts[1].props).toEqual({});

    await core.shutdown();
  });
  test("getPageFromRoleWebCache - multi level - level 1", async () => {

    const { siteModule, roles } = await createTestSite();
    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
      ],
      clone: true,
      roles,
      data: {
        reset: true,
        sync: true,
        sequelize: databaseConfig,
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
    const { Role, SiteRole } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
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
    const siteRole = siteRoles[0];
    // const pagePath = getPagePathFromUri('https://localhost.com:788/sub');
    const page = await getPageFromSiteRoleWebCache(siteRole?.cacheDoc, "/sub", 1);
    expect(page).toBeDefined();
    expect(page?.layout).toBeDefined();
    expect(page?.layout?.path).toBe('/layouts/main');
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test')
    expect(page?.sublayouts).toBeDefined();
    expect(page?.props).toBeDefined();
    expect(page?.props?.title).toBe('Page');
    expect(page?.webPath).toBeDefined();
    expect(page?.webPath).toBe('/sub');

    const subPageItemId = siteRole?.cacheDoc?.web?.paths['/sub/sub'];

    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(2);
    const child = page?.children?.find((c: Page) => c.webPath === "/sub/sub") as Page;
    expect(child).toBeDefined();
    expect(Object.keys(child).length).toBeGreaterThan(1);
    expect(child?.id).toBeDefined();
    expect(child?.id).toBe(subPageItemId);
    expect(child?.values).toBeDefined();
    expect(child?.children).toBeDefined();
    expect(child?.children).toHaveLength(1);
    expect(child?.webPath).toBeDefined();
    expect(child?.webPath).toBe('/sub/sub');
    expect(Object.keys((child?.children || [])[0])).toHaveLength(1);
    await core.shutdown();
  });
  test("getPageResolver", async () => {

    const { siteModule, roles } = await createTestSite();
    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
      ],
      clone: true,
      roles,
      data: {
        reset: true,
        sync: true,
        sequelize: databaseConfig,
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

    const systemContext = await createContext(core, undefined, undefined, undefined, true);
    const { Role, SiteRole } = db.models;
    const role = await Role.findOne(
      createOptions(systemContext, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const siteRoles = await role.getSiteRoles(createOptions(systemContext, {
      where: {
        doc: {
          default: true,
        },
      }
    }));
    expect(siteRoles).toBeDefined();
    expect(siteRoles).toHaveLength(1);
    const siteRole = siteRoles[0]


    const context = await createContextFromRequest({ hostname: 'localhost' } as any, core, false);

    const page = await getPageResolver({}, { uri: 'https://localhost:1233/sub', levels: 0 }, context);
    expect(page).toBeDefined();
    expect(page?.layout).toBeDefined();
    expect(page?.layout?.path).toBe('/layouts/main');
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test')
    expect(page?.sublayouts).toBeDefined();
    expect(page?.props).toBeDefined();
    expect(page?.props?.title).toBe('Page');

    const pageItemId = siteRole?.cacheDoc?.web?.paths['/sub'];
    // const pageItem = role?.cacheDoc.data?.items[pageItemId];
    expect(page?.id).toBeDefined();
    expect(page?.id).toBe(pageItemId);
    expect(page?.values).toBeDefined();
    expect(page?.name).toBeDefined();
    expect(page?.name).toBe('sub');
    expect(page?.displayName).toBeDefined();
    expect(page?.displayName).toBe('Sub');
    expect(page?.webPath).toBeDefined();
    expect(page?.webPath).toBe('/sub');
    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(2);
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test');
    expect(page?.sublayouts).toBeDefined();
    expect(page?.sublayouts).toHaveLength(2);
    expect(page?.sublayouts[0].path).toBe('/sublayouts/sub1');
    expect(page?.sublayouts[0].props).toBeDefined();
    expect(page?.sublayouts[0].props).toEqual({});
    expect(page?.sublayouts[1].path).toBe('/sublayouts/sub2');
    expect(page?.sublayouts[1].props).toBeDefined();
    expect(page?.sublayouts[1].props).toEqual({});

    await core.shutdown();
  });
});