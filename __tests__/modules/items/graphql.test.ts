import { describe, expect, test } from '@jest/globals';
import { execute, GraphQLSchema, parse } from 'graphql';

import coreModule from '../../../src/modules/core';
import { CoreConfig, CoreModuleEvent, CoreModuleEvents, IRole } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
// import { getPageFromRoleWebCache, getPagePathFromUri } from '../../../src/modules/items/logic/web';
import { ItemType, Page } from '../../../src/modules/items/types';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System, withContext } from '../../../src/system';
import { IDependencies } from '../../../src/types/system';

import { createDynamicSite, createTestSite } from './utils';
import { sqliteConfig } from '../../utils/config';
import DatabaseContext from '../../../src/types/models';


describe("modules:items:graphql", () => {
  test("getPage - level 0", async () => {
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    const { siteRole } = roleContext;
    let results;
    await withContext(roleContext, async () => {
      results = await execute({
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

    });
    if (!results) {
      expect(results).toBeDefined();
      return;
    }
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
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

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


  test("getPage - dynamic - site root", async () => {

    const { siteModule, roles } = await createTestSite();
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    // const { siteRole } = roleContext;
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
        uri: 'https://dynamic-root.com/sub/sub/sub',
        levels: 0,
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
    expect(page?.webPath).toBe('/');

    // const subPageItemId = siteRole?.cacheDoc?.web?.paths['/sub/sub'];

    // expect(page?.children).toBeDefined();
    // expect(page?.children).toHaveLength(2);
    // const child = page?.children?.find((cc) => cc.webPath === "/sub/sub") as Page;
    // expect(child).toBeDefined();
    // expect(Object.keys(child).length).toBeGreaterThan(1);
    // expect(child?.id).toBeDefined();
    // expect(child?.id).toBe(subPageItemId);
    // expect(child?.values).toBeDefined();
    // expect(child?.children).toBeDefined();
    // expect(child?.children).toHaveLength(1);
    // expect(child?.webPath).toBeDefined();
    // expect(child?.webPath).toBe('/sub/sub');
    // expect(Object.keys((child?.children || [])[0])).toHaveLength(1);
    await core.shutdown();
  });

  test("getPage - dynamic - sub site", async () => {

    const { siteModule, roles } = await createTestSite();
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    // const { siteRole } = roleContext;
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
        uri: 'https://dynamic.com/dynamic/sub/sub',
        levels: 0,
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
    expect(page?.webPath).toBe('/dynamic');

    await core.shutdown();
  });

  test("getPage - dynamic - sub site sub dynamic item", async () => {

    const { siteModule, roles } = await createTestSite();
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    // const { siteRole } = roleContext;
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
        uri: 'https://dynamic.com/dynamic/view/sub',
        levels: 0,
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
    expect(page?.webPath).toBe('/dynamic/view');

    await core.shutdown();
  });



  test("getPage - dynamic - testing child matching not impacting parent access", async () => {

    const { siteModule, roles } = await createTestSite();
    const schemas: {
      [key: string]: GraphQLSchema
    } = {};
    const schemaCollector: IDependencies & CoreModuleEvents = {
      [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: IRole) => {
        schemas[role.name] = schema;
        return schema;
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
        sequelize: sqliteConfig,
      },
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.configure();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase<DatabaseContext>(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'public' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();

    const roleContext = await createContext(core, undefined, undefined, role, true);
    // const { siteRole } = roleContext;
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
        uri: 'https://dynamic.com/dynamic',
        levels: 0,
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
    expect(page?.webPath).toBe('/dynamic');

    await core.shutdown();
  });
});