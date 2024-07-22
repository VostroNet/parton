import { RoleDoc } from "../../../src/modules/core/types";
import { DataEvent, DataEvents } from "../../../src/modules/data";
import { upsertSiteFromImportSite } from "../../../src/modules/items/logic/site";
import { ImportSite, ItemTemplateDataType, ItemType, SiteRoleDoc } from "../../../src/modules/items/types";
import { createContext, System } from "../../../src/system";
import { IModule } from "../../../src/types/system";

export function createSiteSetupModule(importSite: ImportSite<any>) {
  const moduleTest: IModule & DataEvents = {
    name: 'import-site',
    dependencies: [{
      event: DataEvent.Setup,
      required: {
        before: ["core-role-upsert", "core-field-hash"]
      }
    }],
    [DataEvent.Setup]: async (core: System) => {
      const context = await createContext(core, undefined, undefined, true);
      await upsertSiteFromImportSite(importSite, context);
    }
  };
  return moduleTest;
}


export async function createTestSite() {
  const testItemRoleDoc: SiteRoleDoc = {
    items: {
      r: true,
      sets: [],
    },
    default: true,
  };
  const testRoleDoc: RoleDoc = {
    schema: {
      w: true,
      d: true,
    },
  };
  const siteModule = await createSiteSetupModule({
    name: 'test',
    displayName: 'Test',
    default: true,
    hostnames: ['localhost'],
    sitePath: "/website",
    roles: {
      test: testItemRoleDoc,
    },
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
            },
          ],
        },
      ],
    }],
  });
  return {
    siteModule,
    testRoleDoc,
    testItemRoleDoc,
  };
}