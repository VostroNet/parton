// export interface RoleDefinition {
//   //fs: permission level
//   p?: PermissionLevel,
//   // fl: filter name
//   fl?: string,
//   // f: fields
//   f?: {
//     [key: string]: PermissionLevel
//   }
// }

import { Definition, DefinitionOptions } from '@vostro/gqlize/lib/types';

import { Config } from '../../types/config';
import { DataConfig } from '../data';
import { MigrationConfig } from '../data/types';
import { ExpressConfig } from '../express';
import { HttpConfig } from '../http';
import { SiteRoleDoc } from '../items/types';

// export enum PermissionLevel {
//   Read = 1,
//   Create = 2,
//   Update = 3,
//   Delete = 4,
//   Filter = 5,
// };

export enum RoleModelPermissionLevel {
  global = 'g', // no filter applied
  self = 's', // this ensures the type of filter applied uses the context of the current user
}

export interface Permission {
  r?: boolean | RoleModelPermissionLevel; // Read
  w?: boolean | RoleModelPermissionLevel; // Write
  u?: boolean | RoleModelPermissionLevel; // Update
  d?: boolean | RoleModelPermissionLevel; // Delete
}

export interface RoleModelPermission extends Permission {
  f?: {
    // Fields
    [key: string]: Permission;
  };
  cm?: {
    // Class Methods
    [key: string]: Permission;
  };
  s?: {
    // Subscriptions Events
    [key: string]: Permission;
  };
}

export interface RoleSchema extends Permission {
  models?: {
    [key: string]: RoleModelPermission;
  };
  ext?: {
    // Extensions
    [key: string]: Permission;
  };
  s?: {
    // Subscriptions Events
    [key: string]: Permission;
  };
}
export interface RoleDoc {
  schema?: RoleSchema;
}

export interface SiteConfig {
  displayName?: string;
  hostnames: string[];
  default: boolean;
  roles: {
    [roleName: string]: SiteRoleDoc;
  };
}

export interface CoreConfig
  extends Config,
    DataConfig,
    HttpConfig,
    ExpressConfig {
    // sites?: {
    //   [siteName: string]: SiteConfig;
    // }
    roles?: {
      [roleName: string]: RoleDoc;
    };
  migrations?: MigrationConfig;
}
//TODO: add
// - relationship - options - constraints: boolean

export interface IDefinition extends Definition {
  options?: DefinitionOptions & {
    tableName?: string;
    indexes?: any[];
  };
}

export enum MutationType {
  create = 'create',
  update = 'update',
  destroy = 'destroy',
}
