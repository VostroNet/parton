import { Database } from '@vostro/gqlize';
import GQLManager from '@vostro/gqlize/lib/manager';
import SequelizeAdapter from '@vostro/gqlize-adapter-sequelize';
import { Model, ModelStatic, Options, Sequelize } from 'sequelize';
import { Options as SequelizeOptions } from 'sequelize';

import { System } from '../../system';
import { Config } from '../../types/config';
import { SystemEvent } from '../../types/events';
import DatabaseContext from '../../types/models';
import { Role } from '../../types/models/models/role';
import { IModule } from '../../types/system';
import merge from '../../utils/merge';
import waterfall from '../../utils/waterfall';
import { IDefinition, MutationType } from '../core/types';

import { DataHookEvent, DataHookMap, DataModelHookEvents, Hook } from './hooks';
import { DataContext, FindOptions } from './types';
import { validateFindOptions, validateMutation } from './validation';

export enum DataEvent {
  Initialize = 'data:initialize',
  Configure = 'data:configure',
  ConfigureComplete = 'data:configure-complete',
  Setup = 'data:setup',
  Loaded = 'data:loaded',
  ModelHook = 'data:model-hook',
}
export type DataEvents = {
  readonly [DataEvent.Initialize]?: (
    gqlManager: GQLManager,
    core: System,
  ) => Promise<void>;
  readonly [DataEvent.Configure]?: (
    models: { [key: string]: any },
    core: System,
  ) => Promise<{ [key: string]: any }>;
  readonly [DataEvent.ConfigureComplete]?: (
    models: { [key: string]: any },
    core: System,
  ) => Promise<{ [key: string]: any }>;
  readonly [DataEvent.Setup]?: (
    core: System,
    gqlManager: GQLManager,
  ) => Promise<void>;
  readonly [DataEvent.Loaded]?: (
    core: System,
    gqlManager: GQLManager,
  ) => Promise<void>;
  readonly [DataEvent.ModelHook]?: <T>(
    obj: T,
    defName: string,
    options: FindOptions,
    hook: Hook,
  ) => Promise<T>;
};

export interface DataModulesModels {
  models?: { [key: string]: IDefinition };
}

export interface DataModule
  extends IModule,
  DataEvents,
  DataModelHookEvents,
  DataModulesModels {
  gqlManager?: GQLManager;
  getDatabase?: <T extends DatabaseContext>() => Promise<T>;
  getDefinition?: <T extends IDefinition>(name: string) => T | undefined;
}

export interface DataConfig extends Config {
  data: {
    reset?: boolean;
    sync?: boolean;
    sequelize: SequelizeOptions;
  };
}

export interface DatabaseOptions extends Options {
  debug?: boolean;
  validate?: boolean;
  disableEventLog?: boolean;
  paranoid?: boolean;
  fakeMigrate?: boolean;
}

export function createOptions(o: any, options: FindOptions = {}) {
  let context = o;
  if (o.context) {
    context = o.context;
  }
  const override = o.override || context.override;
  const transaction = o.transaction || context.transaction;
  const opts = Object.assign(
    {
      override,
    },
    {
      transaction,
      context,
    },
    options,
    context.dataloader,
  );
  return opts;
}
export function getDatabaseFromOptions<T extends Sequelize>(
  options: FindOptions,
): Promise<T> {
  const context = getContextFromOptions(options);
  return getDatabaseFromContext<T>(context);
}
export function getDatabaseFromContext<T extends Sequelize>(
  context: DataContext,
): Promise<T> {
  return getDatabase(context.system);
}

/**
 * @deprecated This function is deprecated. Use `/lib/system:getSystemFromContext` instead.
 */
export function getSystemFromContext(context: DataContext): System {
  if (!context.system) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error('system is not defined');
  }
  return context.system;
}

//TODO: this is a bit of a hack need to review
export function getContextFromOptions(options: FindOptions): DataContext {
  let context = options.context;
  if (options.getGraphQLArgs) {
    context = options.getGraphQLArgs().context;
  } else if (context?.getGraphQLArgs) {
    context = context.getGraphQLArgs().context;
  }
  if (!context) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error('context is not defined');
  }
  return context;
}

export function getOverrideFromOptions(options: FindOptions = {}): boolean {
  const context = getContextFromOptions(options) || {};
  return (options.override || context.override) === true;
}
export function getRoleFromOptions(
  options: FindOptions = {},
): Role | undefined {
  const context = getContextFromOptions(options) || {};
  return context.role;
}
// let gqlManager: GQLManager;
export async function getDatabase<T extends Sequelize>(
  system: System,
): Promise<T> {
  const dataModule = system.get<DataModule>('data');
  const gqlManager = dataModule.gqlManager;
  if (!gqlManager) {
    throw 'db instance is not populated something went wrong!';
  }
  return (gqlManager.adapters.sequelize as any).sequelize;
}
export async function getGQLManager(system: System) {
  const gqlManager = system.get<DataModule>('data').gqlManager;
  if (!gqlManager) {
    throw 'db instance is not populated something went wrong!';
  }
  return gqlManager;
}

async function beforeQuery(options: FindOptions, modelName: string) {
  const override = getOverrideFromOptions(options);
  if (override) {
    return options;
  }
  if (!options.valid && !override && !options.validated) {
    options = await validateFindOptions(
      modelName,
      options,
      modelName === 'User' ? 'id' : 'userId',
      (user) => {
        //TODO: check if has relation to user if not set denyOnSelf to true
        if (modelName === 'User') {
          return {
            id: user.id,
          };
        }
        return {
          userId: user.id,
        };
      },
      false,
    );
  }
  if (!options.valid && !override) {
    throw new Error('Access is denied');
  }
  return options;
}
function createBindGlobalHook(hook: DataHookEvent, system: System) {
  return async (modelName: string, init: any, ...rest: any[]) => {
    // if(hook === DataHookEvent.BeforeValidate) {
    //   console.trace("before query");
    // }
    return system.execute(hook, init, ...rest, modelName, system);
  };
}

export function getTableNameFromModel(model: ModelStatic<Model<any, any>>) {
  const schema = (model as any)._schema || "public";
  const tableName = model.getTableName();
  if (typeof tableName === "string") {
    return {
      full: `"${schema}"."${tableName}"`,
      schema: schema,
      tableName: tableName,
    };
  }
  return {
    full: `"${tableName.schema}"${tableName.delimiter}"${tableName.tableName}"`,
    schema: tableName.schema,
    tableName: tableName.tableName,
  };
}

export const dataModule: DataModule = {
  name: 'data',
  gqlManager: undefined,
  ignore: ['gqlManager', 'models', 'getDatabase'],
  // getDatabase: async function getDatabase<T extends DatabaseContext>(): Promise<T> {
  //   if (!dataModule.gqlManager) {
  //     throw 'db instance is not populated something went wrong!';
  //   }
  //   return (dataModule.gqlManager.adapters.sequelize as any).sequelize;
  // },
  [SystemEvent.Initialize]: async (core: System) => {
    core.setOptions(DataEvent.Initialize, {
      ignoreReturn: true,
    });
    core.setOptions(DataEvent.Loaded, {
      ignoreReturn: true,
    });
    core.setOptions(DataEvent.Setup, {
      ignoreReturn: true,
    });
    core.get<DataModule>('data').getDatabase = <T extends Sequelize>() => getDatabase<T>(core);
    core.get<DataModule>('data').getDefinition = <
      T extends IDefinition | undefined,
    >(
      name: string,
    ) => {
      const models = core.get<DataModule>('data').models;
      if (!models) {
        return undefined;
      }
      return models[name] as T;
    };
    await core.execute(DataEvent.Initialize, core);
    let models = core.sortedSliceNames.reduce((m, mod) => {
      const models = core.get<DataModulesModels>(mod)?.models;
      if (models) {
        return merge(m, models);
      }
      return m;
    }, {} as any);

    models = await core.execute(DataEvent.Configure, models, core);
    models = await core.execute(DataEvent.ConfigureComplete, models, core);

    const globalHooks = Object.keys(DataHookEvent).reduce((hooks, hookName) => {
      const dataHookCrumbName = (DataHookEvent as any)[hookName];
      if (core.crumbs[dataHookCrumbName]) {
        const shook = DataHookMap[dataHookCrumbName];
        hooks[shook] = createBindGlobalHook(
          dataHookCrumbName as DataHookEvent,
          core,
        );
      }
      return hooks;
    }, {} as any);
    if (core.get<DataModule>('data').gqlManager) {
      throw new Error('gqlManager is already initialised');
    }

    core.get<DataModule>('data').gqlManager = new Database({
      globalHooks,
    });

    const cfg = core.getConfig<DataConfig>();
    core
      .get<DataModule>('data')
      .gqlManager?.registerAdapter(
        new SequelizeAdapter({}, cfg.data.sequelize),
      );
    await waterfall(Object.keys(models), (key) => {
      const model = models[key];
      return core.get<DataModule>('data').gqlManager?.addDefinition(model);
    });
    const db = await getDatabase<DatabaseContext>(core);
    // const dialect = db.getDialect();
    if (core.getConfig<DataConfig>().data.sequelize.schema) {
      const schemas = await db.getQueryInterface().showAllSchemas() as string[];
      if (!schemas.includes(core.getConfig<DataConfig>().data.sequelize.schema)) {
        await db.getQueryInterface().createSchema(core.getConfig<DataConfig>().data.sequelize.schema);
      }

    }
    if (core.getConfig<DataConfig>().data.sequelize.dialect === "postgres") {
      // const schema = core.getConfig<DataConfig>().data.sequelize.schema || "public";
      // const tables = await db.getQueryInterface().showAllTables(schema) as string[];
      // const tableNames = Object.keys(models).map((modelName) => {
      //   const model = models[modelName];
      //   if(model.options && model.options.tableName) {
      //     return model.options.tableName;
      //   }
      //   return modelName;
      // });
      // const missingTables = tableNames.filter((tableName) => !tables.includes(tableName));
      // for(const tableName of missingTables) {
      //   const model = models[tableName];
      //   if(model) {
      //     const modelInstance = model.model;
      //     const { schema, tableName } = getTableNameFromModel(modelInstance, core);
      //     await db.getQueryInterface().createTable(schema, tableName, modelInstance.getAttributes(), modelInstance.options);
      //   }
      // }
    }
    await core.get<DataModule>('data').gqlManager?.initialise();
    if (cfg.data.reset) {
      await core.get<DataModule>('data').gqlManager?.reset({});
    }
    if (cfg.data.sync) {
      await core.get<DataModule>('data').gqlManager?.sync();
    }

    core.get<DataModule>('data').models = models;

    await core.execute(
      DataEvent.Setup,
      core,
      core.get<DataModule>('data').gqlManager,
    );
    await core.execute(
      DataEvent.Loaded,
      core,
      core.get<DataModule>('data').gqlManager,
    );
    return core;
  },
  [SystemEvent.Ready]: async (core: System) => {
    return core;
  },
  [DataHookEvent.BeforeCreate]: async (
    obj: any,
    options: any,
    defName: string,
  ) => {
    const override = getOverrideFromOptions(options);
    if (override) {
      return obj;
    }
    return validateMutation(
      defName,
      MutationType.create,
      options,
      obj,
      (user, model, roleLevel, context, fieldCheck) => fieldCheck,
      false,
    );
  },
  [DataHookEvent.BeforeUpdate]: async (
    obj: any,
    options: any,
    defName: string,
  ) => {
    const override = getOverrideFromOptions(options);
    if (override) {
      return obj;
    }
    return validateMutation(
      defName,
      MutationType.update,
      options,
      obj,
      (user, model, roleLevel, context, fieldCheck) => fieldCheck,
      false,
    );
  },
  [DataHookEvent.BeforeDestroy]: async (
    obj: any,
    options: any,
    defName: string,
  ) => {
    const override = getOverrideFromOptions(options);
    if (override) {
      return obj;
    }
    return validateMutation(
      defName,
      MutationType.destroy,
      options,
      obj,
      (user, model, roleLevel, context, fieldCheck) => fieldCheck,
      false,
    );
  },
  [DataHookEvent.BeforeCount]: beforeQuery,
  [DataHookEvent.BeforeFind]: beforeQuery,
  [SystemEvent.Shutdown]: async (core: System) => {
    const db = await getDatabase<DatabaseContext>(core);
    if (!db) {
      return core;
    }
    await db.close();
    return core;
  },
};

export default dataModule;
