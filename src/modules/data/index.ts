import { Database } from '@azerothian/gqlize';
import GQLManager from '@azerothian/gqlize/lib/manager';
import SequelizeAdapter from '@azerothian/gqlize-adapter-sequelize';
import { Model, ModelStatic, Op, Options, Sequelize } from 'sequelize';
import { Options as SequelizeOptions } from 'sequelize';

import { System } from '../../system';
import { Config } from '../../types/config';
import { SystemEvent } from '../../types/events';
import DatabaseContext from '../../types/models';
import { Role } from '../../types/models/models/role';
import { Context, IModule } from '../../types/system';
import merge from '../../utils/merge';
import waterfall from '../../utils/waterfall';
import { CoreModuleEvent, CoreModuleEvents, IRole, IUser, MutationType, RoleDoc } from '../core/types';

import { DataHookEvent, DataHookMap, DataModelHookEvents, Hook } from './hooks';
import { DataContext, FindOptions, IDefinition } from './types';
import { validateFindOptions, validateMutation } from './validation';
import { buildSchemaFromDatabase } from './utils';

import models from "./models/index";
import { SiteRole } from '../../types/models/models/site-role';
import { CliEvent, ClIModuleEvents } from '../cli';
import { generateTypes } from './generate-types';
import { GqlJdtEvent, GqlJdtModuleEvents } from '../gqljdt';
import { IJtdMetadata, IJtdMin } from '@azerothian/jtd-types';
import { GraphQLType } from 'graphql';
import { JtdCurrentObject } from '@azerothian/graphql-jtd';
import { createNamespace } from 'cls-hooked';
export const clsHookedNamespace = createNamespace('parton');
Sequelize.useCLS(clsHookedNamespace);

export enum DataEvent {
  Initialize = 'data:initialize',
  Configure = 'data:configure',
  ConfigureComplete = 'data:configure-complete',
  Connected = 'data:connected',
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
    models: { [key: string]: IDefinition },
    core: System,
  ) => Promise<{ [key: string]: any }>;
  readonly [DataEvent.ConfigureComplete]?: (
    models: { [key: string]: IDefinition },
    core: System,
  ) => Promise<{ [key: string]: any }>;
  readonly [DataEvent.Connected]?: (
    core: System,
    gqlManager: GQLManager,
  ) => Promise<void>;

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
  CoreModuleEvents,
  DataEvents,
  DataModelHookEvents,
  DataModulesModels,
  ClIModuleEvents,
  GqlJdtModuleEvents {
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
export interface CreateOptions {
  context: DataContext;
  override?: boolean;
  transaction?: any;
  dataloader?: any;
}

export function createOptions<T>(o: any, options: FindOptions = {}) {
  let context = o;
  if (o.context) {
    context = o.context;
  }
  const override = o.override || context.override;
  const transaction = o.transaction || context.transaction;
  const opts = {
    override,
    transaction,
    context,
    ...options,
    ...context.dataloader
  };

  return opts as T;
}

export function buildOptions<T>(context: Context, options?: T): T {
  return createOptions(context, options) as T;
}




export function getDatabaseFromOptions<T extends Omit<Sequelize, 'models'> & { models: T["models"] }>(
  options: FindOptions,
): Promise<T> {
  const context = getContextFromOptions(options);
  return getDatabaseFromContext<T>(context);
}
export function getDatabaseFromContext<T extends Omit<Sequelize, 'models'> & { models: T["models"] }>(
  context: DataContext,
): Promise<T> {
  return getDatabase<T>(context.system);
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
  if (context.override && !context.getUser) {
    context.getUser = async function getUser(): Promise<IUser<any>> {
      return {
        id: -1,
        userName: "system",
        role: {
          name: "system"
        }
      };
    };
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
export async function getDatabase<T extends Omit<Sequelize, 'models'> & { models: T["models"] }>(
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
  dependencies: ['core'],
  models: models,
  // getDatabase: async function getDatabase<T extends DatabaseContext>(): Promise<T> {
  //   if (!dataModule.gqlManager) {
  //     throw 'db instance is not populated something went wrong!';
  //   }
  //   return (dataModule.gqlManager.adapters.sequelize as any).sequelize;
  // },

  [CliEvent.Configure]: async (args, context, system) => {
    if (args._.indexOf('generate-types') > -1) {
      await generateTypes(system, context, system.cwd, args.output as string);
    }
    // if(args._.indexOf('start-server') > -1) {
    //   await system.execute(SystemEvent.Ready, system);
    // }
  },
  [CoreModuleEvent.GraphQLSchemaConfigure]: async (role: IRole, system: System) => {
    //TODO await DataEvent.Loaded to be fired
    const { gqlManager } = system.get<DataModule>('data');

    const roleDoc: RoleDoc = role.doc;
    const schema = await buildSchemaFromDatabase(system, roleDoc, gqlManager);
    if (!schema) {
      system.logger.error(`no schema returned for role ${role.name}`);
      return;
    }
    return schema;
  },

  [CoreModuleEvent.GetAllRoles]: async (roles: IRole[] | undefined, system: System) => {
    const db = await getDatabase<DatabaseContext>(system);
    const { Role } = db.models;
    roles = (await Role.findAll(
      createOptions(system, {
        override: true,
      }),
    )) as any;
    return roles
  },
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
    core.get<DataModule>('data').getDatabase = <T extends Omit<Sequelize, 'models'> & { models: T["models"] }>() => getDatabase<T>(core);
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
    // console.log("globalHooks", globalHooks);
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
      DataEvent.Connected,
      core,
      core.get<DataModule>('data').gqlManager,
    );
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
  [SystemEvent.ContextCreate]: async (context, system, ref) => {
    const db = await getDatabase<DatabaseContext>(system);
    const { Site, Role, SiteRole } = db.models;
    let { role, site, user } = context;

    if (!site && ref?.hostname) {
      site = await Site.getSiteByHostname(ref.hostname, { system, override: true, role: { name: "system" } });
    }
    if (!site) {
      site = await Site.findOne(createOptions({ override: true }, {
        where: {
          default: true
        }
      }));
    }

    if (!role && user?.role) {
      role = user.role;
    } else if (user) {
      role = await user.getRole(createOptions({ override: true }));
    }
    let siteRole: SiteRole | undefined;

    if (site?.id && role?.id) {
      siteRole = await SiteRole.findOne(
        createOptions({ override: true }, {
          where: {
            siteId: site.id,
            roleId: role.id,
          },
        })
      );
    }
    // if (!siteRole && !role && site?.id) {
    //   siteRole = await SiteRole.findOne(
    //     createOptions({ override: true }, {
    //       where: {
    //         siteId: site.id,
    //         doc: {
    //           default: true,
    //         },
    //       },
    //       include: [{
    //         model: Role,
    //         as: 'role',
    //         required: true,
    //       }]
    //     })
    //   );
    // }
    if (!siteRole && site?.id) {
      siteRole = await SiteRole.findOne(createOptions({ override: true }, {
        where: {
          siteId: site.id,
          doc: {
            default: true,
          }
        },
        include: [{
          model: Role,
          as: 'role',
          required: true,
        }]
      }));
    }
    if (siteRole && !role) {
      role = siteRole.role;
    }
    return {
      ...context,
      role,
      siteRole,
      site,
    };
  },
  [GqlJdtEvent.Configure]: async function (options, system) {
    const db = await getDatabase<DatabaseContext>(system);
    return {
      ...options,
      scalarPostProcessor: (typeDef: IJtdMin<IDataJTDMetadata>, name, graphqlType: GraphQLType, { data, type }: JtdCurrentObject, isScalarType) => {
        if (graphqlType.toString() === "ID") {
          // console.log("ID", typeDef);

          // TODO: better way, maybe look into graphql extensions to include rel info
          const model = db.models[data.name.replace(/(Optional|Required)Input/g, "")];
          // if (name === "siteId") {
          //   console.log("siteId", typeDef);
          // }

          if (!model) {
            return typeDef;
          }
          if (model.associations) {
            const assoc = Object.keys(model?.associations).find((key) => {
              return model.associations[key]?.identifierField === name;
            });
            const association = model?.associations[assoc];
            if (association) {
              typeDef.md = {
                ...typeDef.md,
                rel: association.target?.name,
                relType: association.associationType,
                access: association.associationAccessor,
              };
            }
          }
          if (model.primaryKeyAttributes?.indexOf(name) > -1) {
            typeDef.md.pk = true;
          }
        }
        // if (name === "siteId") {
        //   console.log("siteId", typeDef);
        // }
        // if (isScalarType && (graphqlType as GraphQLScalarType).name === "ID" && data.interfaces?.[0]?.name === "Node") {


        // }

        return typeDef;
      },
    }


  }
};

export default dataModule;

interface IDataJTDMetadata extends IJtdMetadata {
  rel: string
  relType: string
  access: string
  pk: boolean
}
