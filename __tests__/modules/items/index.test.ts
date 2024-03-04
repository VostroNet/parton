import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../src/modules/core';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { CoreConfig } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import itemModule from '../../../src/modules/items';
import { ItemTemplateDataType, ItemType, RoleItemDoc } from '../../../src/modules/items/types';
import { getItemByPath } from '../../../src/modules/items/utils';
import { createContext, System } from '../../../src/system';

import { createSiteSetupModule } from './utils';

describe("modules:items", () => {
  test("template value processing", async() => {
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
          items: [{
            name: "layouts",
            type: ItemType.Folder,
            children: [
              {
                name: "main",
                type: ItemType.Folder,
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
                data: {
                  path: "/sublayouts/sub1"
                }
              }, 
              {
                name: "sub2",
                type: ItemType.Folder,
                data: {
                  path: "/sublayouts/sub2"
                }
              }
            ]
          }, {
            name: "templates",
            type: ItemType.Folder,
            children: [
              {
                name: "page",
                type: ItemType.Template,
                data: {
                  fields: {
                    layout: {
                      type: ItemTemplateDataType.Item,
                    },
                    sublayouts: {
                      type: ItemTemplateDataType.Items,
                    },
                    props: {
                      type: ItemTemplateDataType.Json,
                    }
                  }
                }
              }
            ]
          }, {
            name: 'localhost',
            type: ItemType.Folder,
            templatePath: "/templates/page",
            data: {
              hostnames: ['localhost.com']
            },
            children: [
              {
                name: 'sub',
                displayName: 'Sub',
                type: ItemType.Folder,
                templatePath: "/templates/page",
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
                    name: 'subsub',
                    type: ItemType.Folder,
                  },
                ],
              },
            ],
          }],
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

    const context = await createContext(core, undefined, "system", true);
    const { Role } = db.models;
    const role = await Role.findOne(
      createOptions(context, { where: { name: 'test' } }),
    );
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const store = role?.cacheDoc.data;
    const item = await getItemByPath<any>('/localhost/sub', store);

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