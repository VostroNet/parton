// import Url from "url";

import { GraphQLError } from 'graphql';

import { Role } from '../../../types/models/models/role';
import { DataContext } from '../../data/types';
import {
  Item,
  ItemIdRef,
  ItemLayoutData,
  ItemPageData,
  ItemSublayoutData,
  Page,
  // PagePath,
  SiteRoleWebCacheDoc,
} from '../types';
import { getItemByPath } from '../utils';
import { getDatabase, getSystemFromContext } from '../../data';
import { createContextFromRequest } from '../../express';
import { SystemContext } from '../../../system';
import { minimatch } from 'minimatch';

// export function getTopItemFromUri(store: RoleWebCacheDoc, uri: Url.URL) {
//   const hostname = uri
//   const itemId = Object.keys(store.items).find((itemId) => {
//     const item = store.items[itemId];
//     return (item.data?.hostname || []).includes(hostname);
//   })
//   if(itemId) {
//     return store.items[itemId];
//   }
//   return undefined;
// }

// we use the PagePath type instead of string to ensure that the path has been created here.
// we may change the type from a string to an object in the future.
// export function getPagePathFromUri(uri: string): PagePath {
//   const url = new URL(uri);
//   return {
//     path: `${url.hostname}${url.pathname}`,
//     webPath: url.pathname,
//   };
// }

export async function getPageFromSiteRoleWebCache(
  rwcd: SiteRoleWebCacheDoc,
  webPath: string,
  levels: number = 0,
): Promise<Page | undefined> {
  let itemId = rwcd.web?.paths[webPath];
  if (!itemId) {
    for (const path in rwcd.web.paths) {
      if (minimatch(webPath, path, {
        // matchBase: true,
        partial: true,
      })) {
        itemId = rwcd.web.paths[path];
      }
    }
    if (!itemId) {
      return undefined;
    }
  }
  const item: Item<ItemPageData> = rwcd.data.items[itemId];
  return getPageFromItem(rwcd, item, webPath, levels);
}

export async function getPageFromItem(
  rwcd: SiteRoleWebCacheDoc,
  item: Item<ItemPageData>,
  webPath: string,
  levels: number = 0,
) {
  const store = rwcd.data;
  const layout = item.data?.layout;
  if (!layout?.path) {
    // if no layout path is defined, we can't render the page
    console.warn(`No layout path defined for item ${item.id}`);
    return undefined;
  }
  const layoutItem = getItemByPath<ItemLayoutData>(layout.path, store);

  const sublayouts =
    item.data?.sublayouts?.map((sublayout) => {
      const sublayoutItem = getItemByPath<ItemSublayoutData>(
        sublayout.path,
        store,
      );
      return {
        id: sublayoutItem.id,
        path: sublayout.path,
        props: Object.assign(
          {},
          sublayout.props || {},
          sublayoutItem.data?.props || {},
        ),
      };
    }) || [];

  // TODO: look at getting values maybe have this preprocessed already
  // get layout and sublayout data
  const children = await Promise.all(
    item.children.map((c) => {
      if (levels > 0) {
        const item: Item<ItemPageData> = rwcd.data.items[c];
        const childPath = `${webPath}/${item.name}`;
        return getPageFromItem(rwcd, item, childPath, levels - 1);
      } else {
        return { id: c } as ItemIdRef;
      }
    }),
  );
  const page: Page = {
    id: item.id,
    props: item.data?.props,
    layout: {
      id: layoutItem.id,
      path: layout.path,
      props: Object.assign(
        {},
        layout.props || {},
        layoutItem.data?.props || {},
      ),
    },
    sublayouts,
    webPath: webPath,
    values: item.values,
    name: item.name,
    displayName: item.displayName,
    children: children.filter((c) => c !== undefined) as Page[],
  };
  return page;
}

// export async function getPageFromRole(role: Role, path: string, levels = 0) {
//   // const pagePath = getPagePathFromUri(uri);
//   const db = await getDatabase()
//   const siteRoles = await role.getSiteRoles({
//     include
//   return getPageFromSiteRoleWebCache(role.cacheDoc, path, levels);
// }

export async function getPageResolver(
  _root: any,
  args: { uri: string; levels: number },
  context: DataContext,
) {
  const { uri, levels } = args;
  const url = new URL(uri);

  const system = getSystemFromContext(context);
  const reqContext = await createContextFromRequest({ hostname: url.hostname } as any, system, context.override, context.transaction) as SystemContext;

  if (!reqContext.siteRole?.cacheDoc) {
    throw new GraphQLError('Cache doc is corrupt, unable to retrieve page');
  }
  return getPageFromSiteRoleWebCache(reqContext.siteRole.cacheDoc, url.pathname, levels);
}
