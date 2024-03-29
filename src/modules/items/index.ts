import { GraphQLSchema } from 'graphql';
import { JSONResolver } from 'graphql-scalars';
import { JSONDefinition } from 'graphql-scalars';
import { createSchema } from 'graphql-yoga';

import { SystemEvents } from '../../types/events';
import { Role } from '../../types/models/models/role';
import { Site } from '../../types/models/models/site';
import { IModule } from '../../types/system';
import { CoreModuleEvent, CoreModuleEvents } from '../core';
import { RoleDoc } from '../core/types';
import {
  // DataEvent,
  DataEvents,
  DataModulesModels,
} from '../data';
import { DataContext } from '../data/types';

import { getPageResolver } from './logic/web';
import models from './models';
import {
  Item,
  ItemData,
  ItemHostData,
  ItemTemplateDataType,
  ItemTemplateFieldDefinition,
  RoleCacheDoc,
  RoleItemStore,
  RoleWebCacheDoc,
  SiteDoc,
  WebData,
} from './types';

export enum ItemEvent {
  // Configure = 'item:configure',
  ProcessItem = 'item:process-item',
  ProcessItemField = 'item:process-item-field',
  ProcessRoleCacheDoc = 'item:process-role-cache-doc',
}
export type ItemEvents = {
  readonly [ItemEvent.ProcessItem]?: (
    item: Item<any>,
    siteDoc: SiteDoc,
    roleDoc: RoleDoc,
    store: RoleItemStore,
    context: DataContext,
  ) => Promise<Item<any>>;
  readonly [ItemEvent.ProcessRoleCacheDoc]?: <T extends RoleCacheDoc>(
    doc: T,
    role: Role,
    site: Site,
    context: DataContext,
  ) => Promise<RoleCacheDoc>;
  readonly [ItemEvent.ProcessItemField]?: (
    fieldValue: any,
    item: Item<any>,
    fieldName: string,
    definition: ItemTemplateFieldDefinition,
    store: RoleItemStore,
    context: DataContext,
  ) => Promise<any>;
};
export interface ItemModule
  extends IModule,
    SystemEvents,
    DataModulesModels,
    DataEvents,
    ItemEvents,
    CoreModuleEvents {}

function createPathFromItem(
  item: Item<any>,
  parentPath: string,
  data: WebData,
  store: ItemData,
) {
  let newPath = `${parentPath}/${item.name}`;
  if (item.data?.dynamic) {
    newPath += '/**/*';
  }
  // if(!item.id) {
  //   // eslint-disable-next-line functional/no-throw-statements
  //   throw new Error("Invalid item id");
  // }
  data.paths[newPath] = item.id;
  if (item.data?.dynamic) {
    return;
  }
  if (item.children?.length > 0) {
    item.children.forEach((childId) => {
      const child = store.items[childId];
      if (child) {
        createPathFromItem(child, newPath, data, store);
      }
    });
  }
}

let schema: GraphQLSchema | null = null;

export const itemModule: ItemModule = {
  name: 'item',
  models,
  dependencies: ['data'],
  [ItemEvent.ProcessRoleCacheDoc]: async (doc: RoleWebCacheDoc) => {
    const store = doc.data;
    const topLevelItems: Item<ItemHostData>[] = [];
    Object.keys(store.items).map(async (itemId) => {
      const item = store.items[itemId] as Item<ItemHostData>;
      if (item?.data?.hostnames && Array.isArray(item.data.hostnames)) {
        topLevelItems.push(item);
      }
    });
    doc.web = topLevelItems.reduce(
      (acc, item) => {
        item.data?.hostnames?.forEach((hostname) => {
          // if (!item.id) {
          //   // eslint-disable-next-line functional/no-throw-statements
          //   throw new Error("Invalid item id");
          // }
          acc.hostnames[hostname] = item.id;
          let newPath = `${hostname}`;
          if (item.data?.dynamic) {
            newPath += '/**/*';
          }
          // if (!item.id) {
          //   // eslint-disable-next-line functional/no-throw-statements
          //   throw new Error("Invalid item id");
          // }
          acc.paths[newPath] = item.id;
          if (item.data?.dynamic) {
            return;
          }
          if (item.children?.length > 0) {
            item.children.forEach((childId) => {
              const child = store.items[childId];
              if (child) {
                createPathFromItem(child, newPath, acc, store);
              }
            });
          }
        });
        return acc;
      },
      { hostnames: {}, paths: {} } as WebData,
    );

    return doc as RoleCacheDoc;
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
              sublayouts: [Layout]
              children: [Page]
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
export default itemModule;
