import {
  AssociationOptions,
  InstanceDestroyOptions,
  InstanceRestoreOptions,
  QueryOptions,
  Sequelize,
  SyncOptions,
} from 'sequelize';
import { ValidationOptions } from 'sequelize/lib/instance-validator';

import { System } from '../../system';
import { Model } from '../../types/models/data';

import { FindOptions } from './types';
import { AbstractQuery } from 'sequelize/lib/dialects/abstract/query';
import { IModule } from '../../types/system';

export enum DataHookEvent {
  BeforeValidate = 'data:hook:beforeValidate',
  AfterValidate = 'data:hook:afterValidate',
  ValidationFailed = 'data:hook:validationFailed',
  BeforeCreate = 'data:hook:beforeCreate',
  AfterCreate = 'data:hook:afterCreate',
  BeforeDestroy = 'data:hook:beforeDestroy',
  AfterDestroy = 'data:hook:afterDestroy',
  BeforeRestore = 'data:hook:beforeRestore',
  AfterRestore = 'data:hook:afterRestore',
  BeforeUpdate = 'data:hook:beforeUpdate',
  AfterUpdate = 'data:hook:afterUpdate',
  BeforeSave = 'data:hook:beforeSave',
  AfterSave = 'data:hook:afterSave',
  BeforeUpsert = 'data:hook:beforeUpsert',
  AfterUpsert = 'data:hook:afterUpsert',
  BeforeBulkCreate = 'data:hook:beforeBulkCreate',
  AfterBulkCreate = 'data:hook:afterBulkCreate',
  BeforeBulkDestroy = 'data:hook:beforeBulkDestroy',
  AfterBulkDestroy = 'data:hook:afterBulkDestroy',
  BeforeBulkRestore = 'data:hook:beforeBulkRestore',
  AfterBulkRestore = 'data:hook:afterBulkRestore',
  BeforeBulkUpdate = 'data:hook:beforeBulkUpdate',
  AfterBulkUpdate = 'data:hook:afterBulkUpdate',
  BeforeFind = 'data:hook:beforeFind',
  BeforeFindAfterExpandIncludeAll = 'data:hook:beforeFindAfterExpandIncludeAll',
  BeforeFindAfterOptions = 'data:hook:beforeFindAfterOptions',
  AfterFind = 'data:hook:afterFind',
  BeforeCount = 'data:hook:beforeCount',
  BeforeDefine = 'data:hook:beforeDefine',
  AfterDefine = 'data:hook:afterDefine',
  BeforeInit = 'data:hook:beforeInit',
  AfterInit = 'data:hook:afterInit',
  BeforeAssociate = 'data:hook:beforeAssociate',
  AfterAssociate = 'data:hook:afterAssociate',
  BeforeConnect = 'data:hook:beforeConnect',
  AfterConnect = 'data:hook:afterConnect',
  BeforeSync = 'data:hook:beforeSync',
  AfterSync = 'data:hook:afterSync',
  BeforeBulkSync = 'data:hook:beforeBulkSync',
  AfterBulkSync = 'data:hook:afterBulkSync',
  BeforeQuery = 'data:hook:beforeQuery',
  AfterQuery = 'data:hook:afterQuery',
  BeforeDisconnect = 'data:hook:beforeDisconnect',
  AfterDisconnect = 'data:hook:afterDisconnect',
  BeforePoolAcquire = 'data:hook:beforePoolAcquire',
  AfterPoolAcquire = 'data:hook:afterPoolAcquire',
}

export type DataHookEvents = {
  readonly [DataHookEvent.BeforeDefine]?: (
    attributes: any,
    options: any,
    modelName: string,
  ) => Promise<void> | void;
  readonly [DataHookEvent.AfterDefine]?: (
    model: any,
    modelName: string,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeInit]?: (
    config: any,
    options: any,
  ) => Promise<void> | void;
  readonly [DataHookEvent.AfterInit]?: (sequelize: Sequelize, system: System, module: IModule) => Promise<void> | void;
  readonly [DataHookEvent.BeforeConnect]?: (config: any) => Promise<void> | void;
  readonly [DataHookEvent.AfterConnect]?: (
    connection: any,
    config: any,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeDisconnect]?: (
    connection: any,
  ) => Promise<void> | void;
  readonly [DataHookEvent.AfterDisconnect]?: (connection: any) => Promise<void> | void;
  readonly [DataHookEvent.BeforePoolAcquire]?: (
    connection: any,
  ) => Promise<void> | void;
  readonly [DataHookEvent.AfterPoolAcquire]?: (
    connection: any,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeQuery]?: (options: QueryOptions, query: AbstractQuery, system: System, module: IModule) => Promise<void> | void;
  readonly [DataHookEvent.AfterQuery]?: (options: QueryOptions, query: AbstractQuery, system: System, module: IModule) => Promise<void> | void;
  readonly [DataHookEvent.AfterSync]?: (sequelize: Sequelize) => Promise<void> | void;
  readonly [DataHookEvent.AfterBulkSync]?: (sequelize: Sequelize) => Promise<void> | void;

};

export type DataModelHookEvents = {
  readonly [DataHookEvent.BeforeValidate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: ValidationOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterValidate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: ValidationOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.ValidationFailed]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: ValidationOptions,
    error: Error,
    modelName: string,
    system: System,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeCreate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterCreate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.BeforeDestroy]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: InstanceDestroyOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterDestroy]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: InstanceDestroyOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.BeforeRestore]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: InstanceRestoreOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterRestore]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: InstanceRestoreOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.BeforeUpdate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterUpdate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.BeforeSave]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>> | Model<T1, T2>;
  readonly [DataHookEvent.AfterSave]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>> | Model<T1, T2>;
  readonly [DataHookEvent.BeforeUpsert]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.AfterUpsert]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instance: Model<T1, T2>,
    options: any,
    created: boolean,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>>;
  readonly [DataHookEvent.BeforeBulkCreate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instances: Model<T1, T2>[],
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>[]> | Model<T1, T2>[];
  readonly [DataHookEvent.AfterBulkCreate]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instances: Model<T1, T2>[],
    options: any,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>[]> |  Model<T1, T2>[];
  readonly [DataHookEvent.BeforeBulkDestroy]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<any>;
  readonly [DataHookEvent.AfterBulkDestroy]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeBulkRestore]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<any>;
  readonly [DataHookEvent.AfterBulkRestore]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<any>;
  readonly [DataHookEvent.BeforeBulkUpdate]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<void> | void;
  readonly [DataHookEvent.AfterBulkUpdate]?: (
    options: any,
    modelName: string,
    system: System,
  ) => Promise<void> | void;
  readonly [DataHookEvent.BeforeFind]?: (
    options: FindOptions,
    modelName: string,
    system: System,
  ) => Promise<FindOptions>;
  readonly [DataHookEvent.BeforeFindAfterExpandIncludeAll]?: (
    options: FindOptions,
    modelName: string,
    system: System,
  ) => Promise<FindOptions>;
  readonly [DataHookEvent.BeforeFindAfterOptions]?: (
    options: FindOptions,
    modelName: string,
    system: System,
  ) => Promise<FindOptions>;
  readonly [DataHookEvent.AfterFind]?: <
    T1 extends NonNullable<unknown>,
    T2 extends NonNullable<unknown>,
  >(
    instancesOrInstance: Model<T1, T2>[] | Model<T1, T2> | null,
    options: FindOptions,
    modelName: string,
    system: System,
  ) => Promise<Model<T1, T2>[] | Model<T1, T2> | null>;
  readonly [DataHookEvent.BeforeCount]?: (
    options: FindOptions,
    modelName: string,
    system: System,
  ) => Promise<FindOptions>;
  readonly [DataHookEvent.BeforeSync]?: (
    options: SyncOptions,
    modelName: string,
    system: System,
  ) => Promise<SyncOptions>;
  readonly [DataHookEvent.AfterSync]?: (
    options: SyncOptions,
    modelName: string,
    system: System,
  ) => Promise<SyncOptions>;
  readonly [DataHookEvent.BeforeAssociate]?: (
    data: any,
    options: AssociationOptions,
    modelName: string,
    system: System,
  ) => Promise<any>;
  readonly [DataHookEvent.AfterAssociate]?: (
    data: any,
    options: AssociationOptions,
    modelName: string,
    system: System,
  ) => Promise<any>;
};

export enum Hook {
  beforeValidate = 'beforeValidate',
  afterValidate = 'afterValidate',
  validationFailed = 'validationFailed',
  beforeCreate = 'beforeCreate',
  afterCreate = 'afterCreate',
  beforeDestroy = 'beforeDestroy',
  afterDestroy = 'afterDestroy',
  beforeRestore = 'beforeRestore',
  afterRestore = 'afterRestore',
  beforeUpdate = 'beforeUpdate',
  afterUpdate = 'afterUpdate',
  beforeSave = 'beforeSave',
  afterSave = 'afterSave',
  beforeUpsert = 'beforeUpsert',
  afterUpsert = 'afterUpsert',
  beforeBulkCreate = 'beforeBulkCreate',
  afterBulkCreate = 'afterBulkCreate',
  beforeBulkDestroy = 'beforeBulkDestroy',
  afterBulkDestroy = 'afterBulkDestroy',
  beforeBulkRestore = 'beforeBulkRestore',
  afterBulkRestore = 'afterBulkRestore',
  beforeBulkUpdate = 'beforeBulkUpdate',
  afterBulkUpdate = 'afterBulkUpdate',
  beforeFind = 'beforeFind',
  beforeFindAfterExpandIncludeAll = 'beforeFindAfterExpandIncludeAll',
  beforeFindAfterOptions = 'beforeFindAfterOptions',
  afterFind = 'afterFind',
  beforeCount = 'beforeCount',
  beforeDefine = 'beforeDefine',
  afterDefine = 'afterDefine',
  beforeInit = 'beforeInit',
  afterInit = 'afterInit',
  beforeAssociate = 'beforeAssociate',
  afterAssociate = 'afterAssociate',
  beforeConnect = 'beforeConnect',
  afterConnect = 'afterConnect',
  beforeSync = 'beforeSync',
  afterSync = 'afterSync',
  beforeBulkSync = 'beforeBulkSync',
  afterBulkSync = 'afterBulkSync',
  beforeQuery = 'beforeQuery',
  afterQuery = 'afterQuery',
  beforeDisconnect = 'beforeDisconnect',
  afterDisconnect = 'afterDisconnect',
  beforePoolAcquire = 'beforePoolAcquire',
  afterPoolAcquire = 'afterPoolAcquire',
}

export const DataHookMap: {
  [key: string]: Hook;
} = {
  [DataHookEvent.BeforeValidate]: Hook.beforeValidate,
  [DataHookEvent.AfterValidate]: Hook.afterValidate,
  [DataHookEvent.ValidationFailed]: Hook.validationFailed,
  [DataHookEvent.BeforeCreate]: Hook.beforeCreate,
  [DataHookEvent.AfterCreate]: Hook.afterCreate,
  [DataHookEvent.BeforeDestroy]: Hook.beforeDestroy,
  [DataHookEvent.AfterDestroy]: Hook.afterDestroy,
  [DataHookEvent.BeforeRestore]: Hook.beforeRestore,
  [DataHookEvent.AfterRestore]: Hook.afterRestore,
  [DataHookEvent.BeforeUpdate]: Hook.beforeUpdate,
  [DataHookEvent.AfterUpdate]: Hook.afterUpdate,
  [DataHookEvent.BeforeSave]: Hook.beforeSave,
  [DataHookEvent.AfterSave]: Hook.afterSave,
  [DataHookEvent.BeforeUpsert]: Hook.beforeUpsert,
  [DataHookEvent.AfterUpsert]: Hook.afterUpsert,
  [DataHookEvent.BeforeBulkCreate]: Hook.beforeBulkCreate,
  [DataHookEvent.AfterBulkCreate]: Hook.afterBulkCreate,
  [DataHookEvent.BeforeBulkDestroy]: Hook.beforeBulkDestroy,
  [DataHookEvent.AfterBulkDestroy]: Hook.afterBulkDestroy,
  [DataHookEvent.BeforeBulkRestore]: Hook.beforeBulkRestore,
  [DataHookEvent.AfterBulkRestore]: Hook.afterBulkRestore,
  [DataHookEvent.BeforeBulkUpdate]: Hook.beforeBulkUpdate,
  [DataHookEvent.AfterBulkUpdate]: Hook.afterBulkUpdate,
  [DataHookEvent.BeforeFind]: Hook.beforeFind,
  [DataHookEvent.BeforeFindAfterExpandIncludeAll]:
    Hook.beforeFindAfterExpandIncludeAll,
  [DataHookEvent.BeforeFindAfterOptions]: Hook.beforeFindAfterOptions,
  [DataHookEvent.AfterFind]: Hook.afterFind,
  [DataHookEvent.BeforeCount]: Hook.beforeCount,
  [DataHookEvent.BeforeDefine]: Hook.beforeDefine,
  [DataHookEvent.AfterDefine]: Hook.afterDefine,
  [DataHookEvent.BeforeInit]: Hook.beforeInit,
  [DataHookEvent.AfterInit]: Hook.afterInit,
  [DataHookEvent.BeforeAssociate]: Hook.beforeAssociate,
  [DataHookEvent.AfterAssociate]: Hook.afterAssociate,
  [DataHookEvent.BeforeConnect]: Hook.beforeConnect,
  [DataHookEvent.AfterConnect]: Hook.afterConnect,
  [DataHookEvent.BeforeSync]: Hook.beforeSync,
  [DataHookEvent.AfterSync]: Hook.afterSync,
  [DataHookEvent.BeforeBulkSync]: Hook.beforeBulkSync,
  [DataHookEvent.AfterBulkSync]: Hook.afterBulkSync,
  [DataHookEvent.BeforeQuery]: Hook.beforeQuery,
  [DataHookEvent.AfterQuery]: Hook.afterQuery,
  [DataHookEvent.BeforeDisconnect]: Hook.beforeDisconnect,
  [DataHookEvent.AfterDisconnect]: Hook.afterDisconnect,
  [DataHookEvent.BeforePoolAcquire]: Hook.beforePoolAcquire,
  [DataHookEvent.AfterPoolAcquire]: Hook.afterPoolAcquire,
};

export const HookDefinitions = {
  [Hook.beforeValidate]: { params: 2 },
  [Hook.afterValidate]: { params: 2 },
  [Hook.validationFailed]: { params: 3 },
  [Hook.beforeCreate]: { params: 2 },
  [Hook.afterCreate]: { params: 2 },
  [Hook.beforeDestroy]: { params: 2 },
  [Hook.afterDestroy]: { params: 2 },
  [Hook.beforeRestore]: { params: 2 },
  [Hook.afterRestore]: { params: 2 },
  [Hook.beforeUpdate]: { params: 2 },
  [Hook.afterUpdate]: { params: 2 },
  [Hook.beforeSave]: {
    params: 2,
    proxies: [Hook.beforeUpdate, Hook.beforeCreate],
  },
  [Hook.afterSave]: {
    params: 2,
    proxies: [Hook.afterUpdate, Hook.afterCreate],
  },
  [Hook.beforeUpsert]: { params: 2 },
  [Hook.afterUpsert]: { params: 2 },
  [Hook.beforeBulkCreate]: { params: 2 },
  [Hook.afterBulkCreate]: { params: 2 },
  [Hook.beforeBulkDestroy]: { params: 1 },
  [Hook.afterBulkDestroy]: { params: 1 },
  [Hook.beforeBulkRestore]: { params: 1 },
  [Hook.afterBulkRestore]: { params: 1 },
  [Hook.beforeBulkUpdate]: { params: 1 },
  [Hook.afterBulkUpdate]: { params: 1 },
  [Hook.beforeFind]: { params: 1 },
  [Hook.beforeFindAfterExpandIncludeAll]: { params: 1 },
  [Hook.beforeFindAfterOptions]: { params: 1 },
  [Hook.afterFind]: { params: 2 },
  [Hook.beforeCount]: { params: 1 },
  [Hook.beforeDefine]: { params: 2, sync: true, noModel: true },
  [Hook.afterDefine]: { params: 1, sync: true, noModel: true },
  [Hook.beforeInit]: { params: 2, sync: true, noModel: true },
  [Hook.afterInit]: { params: 1, sync: true, noModel: true },
  [Hook.beforeAssociate]: { params: 2, sync: true },
  [Hook.afterAssociate]: { params: 2, sync: true },
  [Hook.beforeConnect]: { params: 1, noModel: true },
  [Hook.afterConnect]: { params: 2, noModel: true },
  [Hook.beforeDisconnect]: { params: 1, noModel: true },
  [Hook.afterDisconnect]: { params: 1, noModel: true },
  [Hook.beforePoolAcquire]: { params: 1, noModel: true },
  [Hook.afterPoolAcquire]: { params: 2, noModel: true },
  [Hook.beforeSync]: { params: 1 },
  [Hook.afterSync]: { params: 1 },
  [Hook.beforeBulkSync]: { params: 1 },
  [Hook.afterBulkSync]: { params: 1 },
  [Hook.beforeQuery]: { params: 2 },
  [Hook.afterQuery]: { params: 2 },
};

// export const hookList = Object.keys(hookDefinitions);

// export const hookList = [
//   "beforeValidate",
//   "afterValidate",
//   "validationFailed",
//   "beforeCreate",
//   "afterCreate",
//   "beforeDestroy",
//   "afterDestroy",
//   "beforeRestore",
//   "afterRestore",
//   "beforeUpdate",
//   "afterUpdate",
//   "beforeSave",
//   "afterSave",
//   "beforeUpsert",
//   "afterUpsert",
//   "beforeBulkCreate",
//   "afterBulkCreate",
//   "beforeBulkDestroy",
//   "afterBulkDestroy",
//   "beforeBulkRestore",
//   "afterBulkRestore",
//   "beforeBulkUpdate",
//   "afterBulkUpdate",
//   "beforeFind",
//   "beforeFindAfterExpandIncludeAll",
//   "beforeFindAfterOptions",
//   "afterFind",
//   "beforeCount",
//   "beforeDefine",
//   "afterDefine",
//   "beforeInit",
//   "afterInit",
//   "beforeAssociate",
//   "afterAssociate",
//   "beforeConnect",
//   "afterConnect",
//   "beforeSync",
//   "afterSync",
//   "beforeBulkSync",
//   "afterBulkSync",
//   "beforeQuery",
//   "afterQuery",
// ];
