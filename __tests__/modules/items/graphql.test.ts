import { describe, expect, test } from '@jest/globals';
import { execute, GraphQLSchema, parse } from 'graphql';

import coreModule, { CoreModuleEvent, CoreModuleEvents } from '../../../src/modules/core';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
// import { getPageFromRoleWebCache, getPagePathFromUri } from '../../../src/modules/items/logic/web';
import { ItemType, Page } from '../../../src/modules/items/types';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';
import { Role } from '../../../src/types/models/models/role';
import { IDependencies } from '../../../src/types/system';

import { createTestSite } from './utils';
import { databaseConfig } from '../../utils/config';


describe("modules:items:graphql", () => {
  test("getPage - level 0", async () => {
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: Role) => {
        schemas[role.name] = schema;
      }
    }

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
        schemaCollector,

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
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    const { siteRole } = roleContext;
    const results = await execute({
      schema: schemas[role?.name],
      document: parse(`query getPage($uri: String!, $levels: Int) {
        getPage(uri: $uri, levels: $levels) {
          id,
          webPath,
          layout { path, props },
          sublayouts { id, path, props },
          props,
          values,
          children { id }
        }
      }`),
      contextValue: roleContext,
      variableValues: {
        uri: 'https://localhost.com:788/sub',
      },
    });

    const page = results.data?.getPage as Page;
    expect(results.errors).toBeUndefined();


    // const pagePath = getPagePathFromUri('https://localhost.com:788/sub');
    // const page = await getPageFromRoleWebCache(role?.cacheDoc, pagePath, 1);
    expect(page).toBeDefined();
    expect(page).not.toBeNull();
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
    const child = page?.children?.find((cc) => cc?.id === subPageItemId) as Page;
    expect(child).toBeDefined();
    expect(child?.id).toBeDefined();
    expect(child?.id).toBe(subPageItemId);
    await core.shutdown();
  });

  test("getPage - level 1", async () => {

    const { siteModule, roles } = await createTestSite();
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: Role) => {
        schemas[role.name] = schema;
      }
    }

    const config: CoreConfig = {
      name: 'data-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule, siteModule,
        schemaCollector,
        siteModule,
      ],
      clone: true,
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
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    const { siteRole } = roleContext;
    const results = await execute({
      schema: schemas[role?.name],
      document: parse(`query getPage($uri: String!, $levels: Int) {
        getPage(uri: $uri, levels: $levels) {
          id,
          webPath,
          layout { path, props },
          sublayouts { id, path, props },
          values,
          props,
          children { 
            id,
            webPath,
            layout { path, props },
            sublayouts { id, path, props },
            values,
            props,
            children { id }
          }
        }
      }`),
      contextValue: roleContext,
      variableValues: {
        uri: 'https://localhost.com:788/sub',
        levels: 1,
      },
    });

    const page = results.data?.getPage as Page;
    expect(results.errors).toBeUndefined();


    // const pagePath = getPagePathFromUri('https://localhost.com:788/sub');
    // const page = await getPageFromRoleWebCache(role?.cacheDoc, pagePath, 1);
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
    const child = page?.children?.find((cc) => cc.webPath === "/sub/sub") as Page;
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
});