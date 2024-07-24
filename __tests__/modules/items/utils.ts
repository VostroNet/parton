import coreModule from "../../../src/modules/core";
import { CoreConfig, RoleDoc } from "../../../src/modules/core/types";
import dataModule from "../../../src/modules/data";
import itemModule from "../../../src/modules/items";
import { ImportSite, ItemTemplateDataType, ItemType, SiteRoleDoc } from "../../../src/modules/items/types";
import { fieldHashModule } from "../../../src/modules/utils/field-hash";
import { roleUpsertModule } from "../../../src/modules/utils/role-upsert";
import { createSiteSetupModule } from "../../../src/modules/items/setup";


export async function createTestSite() {
  const publicItemRoleDoc: SiteRoleDoc = {
    items: {
      r: true,
      sets: [],
    },
    default: true,
  };
  const adminItemRoleDoc: SiteRoleDoc = {
    items: {
      r: true,
      d: true,
      w: true,
      sets: [],
    },
  };
  const publicRoleDoc: RoleDoc = {
    schema: {
      r: true,
    },
  };

  const adminRoleDoc: RoleDoc = {
    schema: {
      r: true,
      w: true,
      d: true,
    },
  };
  const itemRoles = {
    admin: adminItemRoleDoc,
    public: publicItemRoleDoc,
  };
  const siteModule = await createSiteSetupModule([
    createTestSiteDefinition("test", ["test.com"], true, itemRoles),
    createTestSiteDefinition("admin-only", ["admin-only.com"], false, {
      admin: {
        ...adminItemRoleDoc,
        default: true
      },
    })
  ]);
  return {
    siteModule,
    roles: {
      admin: adminRoleDoc,
      public: publicRoleDoc,
    },
    siteRoles: itemRoles,
  };
}


export function createTestSiteDefinition(name: string, hostnames: string[], def: boolean, itemRoles: { [roleName: string]: SiteRoleDoc }): ImportSite<any> {
  return {
    name,
    displayName: name,
    default: def,
    hostnames: hostnames,
    sitePath: "/website",
    roles: itemRoles,
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
      name: 'website',
      type: ItemType.Folder,
      templatePath: "/templates/page",
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
              }
            },
            {
              name: 'sub',
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
              }]
            },
          ],
        },
      ],
    }],
  }
}

export async function createBasicConfig(name: string = "basic", defaultModules: any[] = []) {
  const { siteModule, roles } = await createTestSite();

  const config: CoreConfig = {
    name,
    slices: [
      ...defaultModules,
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
      sequelize: {
        dialect: 'sqlite',
        storage: ':memory:',
        logging: false,
      },
    },
    session: {
      secret: "Hello",
      resave: false,
      saveUninitialized: false,
    }
  };
  return config;
}