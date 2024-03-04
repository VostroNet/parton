import { describe, expect, test } from '@jest/globals';
import { execute, GraphQLSchema, parse } from 'graphql';

import coreModule, { CoreModuleEvent, CoreModuleEvents } from '../../../src/modules/core';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
// import { getPageFromRoleWebCache, getPagePathFromUri } from '../../../src/modules/items/logic/web';
import { ItemType, Page, RoleItemDoc } from '../../../src/modules/items/types';
import { createContext, System } from '../../../src/system';
import { Role } from '../../../src/types/models/models/role';
import { IDependencies } from '../../../src/types/system';

import { createSiteSetupModule } from './utils';


describe("modules:items:graphql", () => {
  test("getPage - level 0", async() => {
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
        roleUpsertModule,
        createSiteSetupModule({
          name: 'test',
          displayName: 'Test',
          default: true,
          items: [{
            name: "layouts",
            type: ItemType.Folder,
            children: [
              {
                name: "main",
                type: ItemType.Folder,
                templatePath: "/templates/layout",
                data: {
                  path: "/layouts/main"
                }
              }
            ]
          }, {
            name: "sublayouts",
            type: ItemType.Folder,
            children: [
              {
                name: "sub1",
                type: ItemType.Folder,
                templatePath: "/templates/sublayout",
                data: {
                  path: "/sublayouts/sub1"
                }
              }, 
              {
                name: "sub2",
                type: ItemType.Folder,
                templatePath: "/templates/sublayout",
                data: {
                  path: "/sublayouts/sub2"
                }
              }
            ]
          }, {
            name: 'localhost',
            type: ItemType.Folder,
            data: {
              hostnames: ['localhost.com']
            },
            children: [
              {
                name: 'sub',
                displayName: 'Sub',
                type: ItemType.Folder,
                data: {
                  props: {
                    "title": "Page"
                  },
                  layout: {
                    path: "/layouts/main",
                    props: {
                      title: "Test"
                    }
                  },
                  sublayouts: [{
                    placeholder: "main",
                    path: "/sublayouts/sub1",
                  }, {
                    placeholder: "main",
                    path: "/sublayouts/sub2"
                  }], 
                },
                children: [{
                  name: 'sub',
                  displayName: 'Sub',
                  type: ItemType.Folder,
                  data: {
                    props: {
                      "title": "Page"
                    },
                    layout: {
                      path: "/layouts/main",
                      props: {
                        title: "Test"
                      }
                    },
                    sublayouts: [{
                      placeholder: "main",
                      path: "/sublayouts/sub1",
                    }, {
                      placeholder: "main",
                      path: "/sublayouts/sub2"
                    }], 
                  },
                  children: [
                    {
                      name: 'sub',
                      type: ItemType.Folder,
                    },
                  ],
                }],
              },
            ],
          }],
        }),
        schemaCollector,
        
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

    const context = await createContext(core, undefined, "system", true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    
    const roleContext = await createContext(core, undefined, role?.name, true);
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
    expect(page?.layout).toBeDefined();
    expect(page?.layout?.path).toBe('/layouts/main');
    expect(page?.layout?.props).toBeDefined();
    expect(page?.layout?.props?.title).toBe('Test')
    expect(page?.sublayouts).toBeDefined();
    expect(page?.props).toBeDefined();
    expect(page?.props?.title).toBe('Page');
    expect(page?.webPath).toBeDefined();
    expect(page?.webPath).toBe('/sub');

    const subPageItemId = role?.cacheDoc?.web?.paths['localhost.com/sub/sub'];

    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(1);
    const child = page?.children?.[0] as Page;
    expect(child).toBeDefined();
    expect(child?.id).toBeDefined();
    expect(child?.id).toBe(subPageItemId);
    await core.shutdown();
  });

  test("getPage - level 1", async() => {
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
        roleUpsertModule,
        createSiteSetupModule({
          name: 'test',
          displayName: 'Test',
          default: true,
          items: [{
            name: "layouts",
            type: ItemType.Folder,
            children: [
              {
                name: "main",
                type: ItemType.Folder,
                templatePath: "/templates/layout",
                data: {
                  path: "/layouts/main"
                }
              }
            ]
          }, {
            name: "sublayouts",
            type: ItemType.Folder,
            children: [
              {
                name: "sub1",
                type: ItemType.Folder,
                templatePath: "/templates/sublayout",
                data: {
                  path: "/sublayouts/sub1"
                }
              }, 
              {
                name: "sub2",
                type: ItemType.Folder,
                templatePath: "/templates/sublayout",
                data: {
                  path: "/sublayouts/sub2"
                }
              }
            ]
          }, {
            name: 'localhost',
            type: ItemType.Folder,
            data: {
              hostnames: ['localhost.com']
            },
            children: [
              {
                name: 'sub',
                displayName: 'Sub',
                type: ItemType.Folder,
                data: {
                  props: {
                    "title": "Page"
                  },
                  layout: {
                    path: "/layouts/main",
                    props: {
                      title: "Test"
                    }
                  },
                  sublayouts: [{
                    placeholder: "main",
                    path: "/sublayouts/sub1",
                  }, {
                    placeholder: "main",
                    path: "/sublayouts/sub2"
                  }], 
                },
                children: [{
                  name: 'sub',
                  displayName: 'Sub',
                  type: ItemType.Folder,
                  data: {
                    props: {
                      "title": "Page"
                    },
                    layout: {
                      path: "/layouts/main",
                      props: {
                        title: "Test"
                      }
                    },
                    sublayouts: [{
                      placeholder: "main",
                      path: "/sublayouts/sub1",
                    }, {
                      placeholder: "main",
                      path: "/sublayouts/sub2"
                    }], 
                  },
                  children: [
                    {
                      name: 'sub',
                      type: ItemType.Folder,
                    },
                  ],
                }],
              },
            ],
          }],
        }),
        schemaCollector,
        
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

    const context = await createContext(core, undefined, "system", true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    
    const roleContext = await createContext(core, undefined, role?.name, true);
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

    const subPageItemId = role?.cacheDoc?.web?.paths['localhost.com/sub/sub'];

    expect(page?.children).toBeDefined();
    expect(page?.children).toHaveLength(1);
    const child = page?.children?.[0] as Page;
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