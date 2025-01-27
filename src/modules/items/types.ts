import { CoreConfig, RoleDoc } from '../core/types';

export enum ItemType {
  Folder = 'folder',
  File = 'file',
  Template = 'template',
}

export type ItemId = string;

export type ItemIdRef = {
  id: ItemId;
};

export interface Item<T> {
  id: ItemId;
  name: string;
  type: string | ItemType;
  parentId?: ItemId;
  template?: ItemId;
  displayName?: string;
  index?: number;
  data?: T;
  values?: any;
  children: ItemId[];
}

export enum ItemTemplateDataType {
  Sublayouts = 'sublayouts',
  Item = 'item',
  Items = 'items',
  File = 'file',
  Files = 'files',
  Text = 'text',
  Json = 'json',
  Html = 'html',
  Boolean = 'bool',
}

export interface ItemTemplateFieldDefinition {
  private?: boolean;
  type: string | ItemTemplateDataType;
}

export interface ItemTemplateData {
  [key: string]: ItemTemplateFieldDefinition;
}

export interface ItemData {
  items: {
    [key: ItemId]: Item<any>;
  };
  paths: {
    [key: string]: ItemId;
  };
}

export interface SiteRoleItemStore extends ItemData {
  templateData: {
    [key: ItemId]: ItemTemplateData;
  };
}
// export interface RoleWebItemStore extends RoleItemStore {
//   hostnames: {
//     [key: string]: ItemId
//   }
// }

export interface ImportRef {
  ref?: string;
}

export interface ImportItem<T> extends ImportRef {
  id?: ItemId;
  name: string;
  type?: string | ItemType;
  template?: string;
  displayName?: string;
  index?: number;
  data?: T;
  children?: ImportItem<any>[];
}

export interface ItemPermission {
  r?: boolean;
  w?: boolean;
  d?: boolean;
}
export interface ItemPermissionSet {
  permission: ItemPermission;
  paths: string[];
}

export interface ItemPermissions extends ItemPermission {
  sets?: ItemPermissionSet[];
}

export interface SiteRoleDoc {
  items: ItemPermissions;
  default?: boolean;
}

export interface SiteDoc {
  data: ItemData;
}

export interface ImportSite<T> {
  name: string;
  displayName?: string;
  default?: boolean;
  hostnames?: string[];
  sitePath: string;
  roles: {
    [roleName: string]: SiteRoleDoc;
  }
  items: ImportItem<T>[] | ImportRef;
}

export interface SiteRoleCacheDoc {
  // roleHash: string;
  rootPath: string;
  siteHash: string;
  data: SiteRoleItemStore
}

// export type PagePath = {
//   path: string;
//   webPath: string;
// };
export interface WebData {
  // hostnames: {
  //   [key: string]: ItemId;
  // };
  paths: {
    [key: string]: ItemId;
  };
}
export interface SiteRoleWebCacheDoc extends SiteRoleCacheDoc {
  web?: WebData;
}

export interface Page {
  id: string;
  name: string;
  displayName?: string;
  values: any;
  webPath: string;
  props?: any;
  layout: {
    id: string;
    path: string;
    props: any;
  };
  sublayouts: {
    id: string;
    path: string;
    props: any;
  }[];
  children?: Page[];
}

export interface ItemPageData {
  props?: any;
  layout: {
    path: string;
    props: any;
  } | string;
  sublayouts: {
    path: string;
    placeholder: string;
    props: any;
  }[];
  dynamic?: boolean;
}
export interface ItemHostData extends ItemPageData {
  hostnames: string[];
}

export interface ItemLayoutData {
  props: any;
}
export interface ItemSublayoutData {
  props: any;
}

export interface ItemConfig extends CoreConfig {
  sites?: [
    {
      items: ImportSite<any>;
      roles: {
        [key: string]: RoleDoc;
      };
    },
  ];
}
