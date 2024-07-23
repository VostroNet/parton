import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
import { getItemByPath } from '../../../src/modules/items/utils';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';
import { createTestSite } from './utils';


describe("modules:items", () => {
  test("template value processing", async () => {
    const { roles, siteModule } = await createTestSite();
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
      // clone: true,
      roles,
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
    const { Role, SiteRole } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );

    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const siteRole = await SiteRole.findOne(
      createOptions(context, { where: { roleId: role?.id } }),
    );

    const store = siteRole?.cacheDoc.data;
    const item = await getItemByPath<any>('/website/sub', store);

    expect(item).toBeDefined();
    expect(item).not.toBeNull();
    expect(item?.data).toBeDefined();
    expect(item?.data).not.toBeNull();
    expect(item?.data?.props).toBeDefined();
    expect(item?.data?.props).not.toBeNull();
    expect(item?.data?.props?.title).toBe("Page");

    expect(item?.values).toBeDefined();
    expect(item?.values).not.toBeNull();
    expect(item?.values?.props?.title).toBe("Page");

    await core.shutdown();
  });
});