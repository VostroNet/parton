// import fs from 'fs/promises';
import path from 'path';

import { minimatch } from 'minimatch';
import { v4 as uuid } from 'uuid';

// import { readJSONFile } from '../../utils/fs';
import waterfall from '../../utils/waterfall';
import { DataContext } from '../data/types';

import {
  ImportItem,
  ImportRef,
  Item,
  ItemData,
  ItemPermissions,
  ItemTemplateData,
  ItemType,
  SiteDoc,
  SiteRoleDoc,
  SiteRoleItemStore,
} from './types';

import { ItemEvent } from '.';
import { readJSONFile } from '../../utils/fs';
import { getSystemFromContext } from '../../system';

export async function createItemData(
  store: ItemData,
  children: ImportItem<any>[] | ImportRef | undefined | null,
  parentId?: string,
  pwd = '/',
  workingDir = process.cwd(),
): Promise<string[]> {
  let cwd = workingDir;
  const childrenRef = children as ImportRef;
  if (children && childrenRef?.ref) {
    const refFilePath = path.resolve(cwd, childrenRef.ref);
    cwd = path.dirname(refFilePath);
    workingDir = cwd; // need to override this for the loop
    children = await readJSONFile<ImportItem<any>[]>(refFilePath);
  }
  if (!Array.isArray(children) || !children) {
    return [];
  }
  const result: string[] = await waterfall(
    children,
    async (itemData: ImportItem<any> | null, prevVal: string[]) => {
      const id = await createSingleItemData(
        itemData,
        cwd,
        pwd,
        store,
        parentId,
      );
      prevVal.push(id);
      return prevVal;
    },
    [] as string[],
  );
  return result;
}

export async function createSingleItemData(
  itemData: ImportItem<any> | null,
  cwd: string,
  pwd: string,
  store: ItemData,
  parentId?: string,
) {
  const itemRef = itemData as ImportRef;
  if (itemRef?.ref) {
    const refFilePath = path.resolve(cwd, itemRef.ref);
    cwd = path.dirname(refFilePath);
    itemData = await readJSONFile<ImportItem<any>>(refFilePath);
  }
  if (!itemData) {
    throw new Error('Invalid item data');
  }
  const id = itemData.id || uuid();
  const currentPwd = `${pwd}${itemData.name}`;
  store.paths[currentPwd] = id;
  const item: Item<any> = {
    id,
    name: itemData.name,
    type: itemData.type || ItemType.Folder,
    parentId,
    templatePath: itemData.templatePath,
    displayName: itemData.displayName,
    index: itemData.index || 0,
    data: itemData.data,
    children: await createItemData(
      store,
      itemData.children,
      id,
      `${currentPwd}/`,
      cwd,
    ),
  };

  store.items[id] = item;
  return id;
}

export async function createItemDataFromFile(
  filePath: string,
  parentId?: string,
  pwd = '/',
  cwd = process.cwd(),
): Promise<ItemData> {
  const store: ItemData = {
    items: {},
    paths: {},
  };
  const p = path.resolve(cwd, filePath);
  const fileData = await readJSONFile<ImportItem<any>[]>(p);
  if (!fileData) {
    return store;
  }
  await createItemData(store, fileData, parentId, pwd, path.dirname(filePath));
  return store;
}

export async function createItemDataFromImportItems(
  items: ImportItem<any>[] | ImportRef,
  cwd?: string,
): Promise<ItemData> {
  const store: ItemData = {
    items: {},
    paths: {},
  };
  await createItemData(store, items, undefined, undefined, cwd);
  return store;
}

export function compileTemplateDataForItem(
  item: Item<ItemTemplateData>,
  store: ItemData,
): ItemTemplateData {
  let current = item;
  const templates = [];
  if (item.type === ItemType.Template) {
    templates.push(item);
  }
  // eslint-disable-next-line functional/no-loop-statements
  while (current.templatePath) {
    current = store.items[store.paths[current.templatePath]];
    if (current) {
      templates.push(current);
    }
    if (!current.templatePath) {
      break;
    }
  }
  return templates.reverse().reduce((o, template) => {
    return Object.assign(o, template.data?.fields);
  }, {} as ItemTemplateData);
}

export function cloneItemData<ItemData>(store: ItemData): ItemData {
  return JSON.parse(JSON.stringify(store)); // is dirty but absolute
}

export async function createRoleItemsCache(
  siteDoc: SiteDoc,
  siteRoleDoc: SiteRoleDoc,
  context: DataContext,
) {
  if (!siteRoleDoc?.items) {
    throw new Error('Invalid item permissions');
  }
  if (!siteDoc?.data) {
    throw new Error('Invalid site item data');
  }
  const current = siteDoc.data;
  const permissions = siteRoleDoc.items;

  const store: SiteRoleItemStore = {
    templateData: {},
    ...cloneItemData(current),
  };
  // permission check on the store
  Object.keys(store.paths).forEach((itemPath) => {
    const itemId = store.paths[itemPath];
    if (!isItemReadable(itemPath, permissions)) {
      delete store.items[itemId];
      delete store.paths[itemPath];
    }
  });
  const pathItemIds = Object.keys(store.paths).map((path) => store.paths[path]);
  Object.keys(store.items).forEach((itemId) => {
    if (!pathItemIds.includes(itemId)) {
      delete store.items[itemId];
    }
  });
  // maybe only do this on demand?
  const core = getSystemFromContext(context);
  await Promise.all(
    Object.keys(store.items).map(async (itemId) => {
      const item = store.items[itemId];
      item.values = await processTemplateFieldsForItem(item, store, context);
      item.children = item.children.filter((childId) => {
        return store.items[childId];
      });

      store.items[itemId] = await core.execute(
        ItemEvent.ProcessItem,
        item,
        siteDoc,
        siteRoleDoc,
        store,
        context,
      );
    }),
  );
  return store;
}
async function processTemplateFieldsForItem(
  item: Item<any>,
  store: SiteRoleItemStore,
  context: DataContext,
) {
  if (!item.templatePath || !item.data) {
    return {};
  }
  const templateData = getTemplateDataForItem(item, store);
  const itemData = item.data;
  const core = getSystemFromContext(context);
  return waterfall(
    Object.keys(templateData),
    async (key, output) => {
      const value = itemData[key];
      const def = templateData[key];
      if (def.private) {
        return undefined;
      }
      output[key] = await core.execute(
        ItemEvent.ProcessItemField,
        value,
        item,
        key,
        def,
        store,
        context,
      );
      return output;
    },
    {} as any,
  );
}

export function getItemByPath<T>(path: string, store: SiteRoleItemStore) {
  return store.items[store.paths[path]] as Item<T>;
}

export function getTemplateDataForItem(item: Item<any>, store: SiteRoleItemStore) {
  if (!item.templatePath) {
    return {};
  }
  const templateItem = getItemByPath<ItemTemplateData>(
    item.templatePath,
    store,
  );
  if (!templateItem?.id) {
    return {};
  }
  if (!store.templateData[templateItem.id]) {
    store.templateData[templateItem.id] = compileTemplateDataForItem(
      templateItem,
      store,
    );
  }
  return store.templateData[templateItem.id];
}

export function isItemReadable(itemPath: string, permissions: ItemPermissions) {
  // if any of the sets allowed read, then it is readable
  if (permissions?.r) {
    return true;
  }
  if (permissions.sets) {
    return permissions.sets
      .filter(
        (set) =>
          set.paths?.filter((setPath) => {
            if (setPath !== itemPath) {
              const result = minimatch(itemPath, setPath, {
                partial: true,
                matchBase: true,
              });
              return result;
            }
            return true;
          }).length > 0,
      )
      .reduce((o: boolean, set) => {
        return o || set.permission.r === true;
      }, false);
  }
  return false;
}
