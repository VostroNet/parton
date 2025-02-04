import { GraphQLSchema } from 'graphql';
import { JSONResolver } from 'graphql-scalars';
import { JSONDefinition } from 'graphql-scalars';
import { createSchema } from 'graphql-yoga';

import { SystemEvents } from '../../types/events';
import { Site } from '../../types/models/models/site';
import { SiteRole } from '../../types/models/models/site-role';
import { IModule } from '../../types/system';
import { CoreModuleEvent, CoreModuleEvents, RoleDoc } from '../core/types';
import {
  // DataEvent,
  DataEvents,
  DataModulesModels,
} from '../data';
import { DataContext } from '../data/types';

import { getPageResolver } from './logic/web';
import models from './models/index';
import {
  Item,
  ItemData,
  ItemHostData,
  ItemTemplateDataType,
  ItemTemplateFieldDefinition,
  SiteDoc,
  SiteRoleCacheDoc,
  SiteRoleItemStore,
  SiteRoleWebCacheDoc,
  WebData,
} from './types';

export enum ItemEvent {
  // Configure = 'item:configure',
  ProcessItem = 'item:process-item',
  ProcessItemField = 'item:process-item-field',
  ProcessSiteRoleCacheDoc = 'item:process-site-role-cache-doc',
}
export type ItemEvents = {
  [ItemEvent.ProcessItem]?(
    item: Item<any>,
    siteDoc: SiteDoc,
    roleDoc: RoleDoc,
    store: SiteRoleItemStore,
    context: DataContext,
    module: IModule
  ): Promise<Item<any>>;
  [ItemEvent.ProcessSiteRoleCacheDoc]?<T extends SiteRoleCacheDoc>(
    doc: T,
    siteRole: SiteRole,
    site: Site,
    context: DataContext,
    module: IModule
  ): Promise<SiteRoleCacheDoc>;
  [ItemEvent.ProcessItemField]?(
    fieldValue: any,
    item: Item<any>,
    fieldName: string,
    definition: ItemTemplateFieldDefinition,
    store: SiteRoleItemStore,
    context: DataContext,
    module: IModule
  ): Promise<any>;
  readonly [ItemEvent.ProcessItem]?: (
    item: Item<any>,
    siteDoc: SiteDoc,
    roleDoc: RoleDoc,
    store: SiteRoleItemStore,
    context: DataContext,
    module: IModule
  ) => Promise<Item<any>>;
  readonly [ItemEvent.ProcessSiteRoleCacheDoc]?: <T extends SiteRoleCacheDoc>(
    doc: T,
    siteRole: SiteRole,
    site: Site,
    context: DataContext,
    module: IModule
  ) => Promise<SiteRoleCacheDoc>;
  readonly [ItemEvent.ProcessItemField]?: (
    fieldValue: any,
    item: Item<any>,
    fieldName: string,
    definition: ItemTemplateFieldDefinition,
    store: SiteRoleItemStore,
    context: DataContext,
    module: IModule
  ) => Promise<any>;
};
export interface ItemModule
  extends IModule,
  SystemEvents,
  DataModulesModels,
  DataEvents,
  ItemEvents,
  CoreModuleEvents { }

function createPathFromItem(
  item: Item<any>,
  parentPath: string,
  data: WebData,
  store: ItemData,
) {
  const currentPath = `${parentPath}/${item.name}`;
  if (item.data?.dynamic) {
    data.paths[`${currentPath}/**/*`] = item.id;
  }
  data.paths[currentPath] = item.id;

  if (item.children?.length > 0) {
    item.children.forEach((childId) => {
      const child = store.items[childId];
      if (child) {
        createPathFromItem(child, currentPath, data, store);
      }
    });
  }
}

let schema: GraphQLSchema | null = null;

export const itemsModule: ItemModule = {
  name: 'item',
  models,
  dependencies: ['data'],
  [ItemEvent.ProcessSiteRoleCacheDoc]: async (doc: SiteRoleWebCacheDoc) => {
    const store = doc.data;
    const itemId = store.paths[doc.rootPath];
    if (!itemId) {
      throw new Error(`Root item path not found - ${doc.rootPath}`);
    }
    const rootItem: Item<ItemHostData> = store.items[itemId] as Item<ItemHostData>;
    if (!rootItem) {
      throw new Error('Root item not found');
    }

    doc.web = { paths: {} };

    let newPath = ``;
    if (rootItem.data?.dynamic) {
      newPath += '/**/*';
    }
    // if (!item.id) {
    //   // eslint-disable-next-line functional/no-throw-statements
    //   throw new Error("Invalid item id");
    // }
    if (rootItem.data?.dynamic) {
      doc.web.paths["/**/*"] = rootItem.id;
      return doc as SiteRoleCacheDoc;
    }
    doc.web.paths["/"] = rootItem.id;
    if (rootItem.children?.length > 0) {
      rootItem.children.forEach((childId) => {
        const child = store.items[childId];
        if (child) {
          createPathFromItem(child, newPath, doc.web, store);
        }
      });
    }
    return doc as SiteRoleCacheDoc;
  },
  [ItemEvent.ProcessItemField]: async (value, item, fieldName, definition) => {
    let newValue = value;
    switch (definition.type) {
      case ItemTemplateDataType.File:
        //TODO: need to lookup the file and return the uri
        newValue = {
          id: value,
          uri: `/file.api/${value}`,
          meta: {},
        };
        break;
      case ItemTemplateDataType.Files:
        newValue = await Promise.all(
          value.map(async (fileId: string) => {
            return {
              id: fileId,
              uri: `/file.api/${fileId}`,
              meta: {},
            };
          }),
        );
        break;
      default:
        newValue = value;
    }
    return newValue;
  },
  [CoreModuleEvent.GraphQLSchemaConfigure]: async () => {
    if (!schema) {
      schema = createSchema({
        typeDefs: [
          JSONDefinition,
          /* GraphQL */ `
            type Page {
              id: ID!
              name: String
              displayName: String
              values: JSON
              webPath: String
              props: JSON
              layout: Layout
              sublayouts: [Sublayout]
              children: [Page]
            }
            type Sublayout {
              id: ID!
              path: String
              placeholder: String
              index: Int
              props: JSON
            }
            type Layout {
              id: ID!
              path: String
              props: JSON
            }
            type Query {
              getPage(uri: String!, levels: Int): Page
            }
          `,
        ],
        resolvers: {
          JSON: JSONResolver,
          Query: {
            getPage: getPageResolver,
          },
        },
      });
    }
    return schema;
  },
};
export default itemsModule;
