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


import { GraphQLSchema } from 'graphql';
import { System } from '../../system';
import { Config } from '../../types/config';
import { DataConfig } from '../data';
import { ExpressConfig, ExpressModuleEvents } from '../express';
import { HttpConfig } from '../http';
import { SiteRoleDoc } from '../items/types';
import { PassportStatic } from 'passport';
import { Context } from '../../types/system';
import { ClIModule } from '../cli';

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
}
//TODO: add
// - relationship - options - constraints: boolean



export enum MutationType {
  create = 'create',
  update = 'update',
  destroy = 'destroy',
}

export type IUser<T> = {
  id: any;
} & Partial<T>;

export type IRole = {
  id: any;
  name: string;
  doc: RoleDoc,
}
export type ISite = {
  id: any;
  name: string;
  doc: SiteConfig;
}

export enum CoreModuleEvent {
  GraphQLSchemaConfigure = 'core:graphql-schema:configure',
  GraphQLSchemaCreate = 'core:graphql-schema:create',
  AuthProviderRegister = 'core:auth:provider:register',
  AuthLogoutRequest = 'core:auth:logout:request',
  AuthLoginRequest = 'core:auth:login:request',
  AuthLoginSuccessResponse = 'core:auth:login:success',
  UserSerialize = 'core:user:serialize',
  UserDeserialize = 'core:user:deserialize',
  GetAllRoles = 'core:roles:get:all'
}


export interface CoreModuleEvents {
  [CoreModuleEvent.GraphQLSchemaConfigure]?: (
    role: IRole,
    core: System,
  ) => Promise<GraphQLSchema | undefined>;
  [CoreModuleEvent.GraphQLSchemaCreate]?: (
    schema: GraphQLSchema,
    role: IRole,
    core: System,
  ) => Promise<GraphQLSchema>;
  [CoreModuleEvent.AuthProviderRegister]?: (passport: PassportStatic, system: System) => Promise<IAuthProvider>;
  [CoreModuleEvent.AuthLoginSuccessResponse]?: <T>(loginResponse: any, user: IUser<T>, context: Context) => Promise<any>
  [CoreModuleEvent.UserSerialize]?: <T>(user: IUser<T>, system: System) => Promise<string>;
  [CoreModuleEvent.UserDeserialize]?: <T>(serialized: string, system: System) => Promise<any> // TODO: dont know why i cant define a return type
  [CoreModuleEvent.GetAllRoles]?: (roles: IRole[] | undefined, system: System) => Promise<IRole[]>
}


export interface IAuthProvider {
  name: string;
  isBearer?: boolean;
}

export interface ICoreModule
  extends ClIModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  schemas: {
    [key: string]: GraphQLSchema;
  };
}