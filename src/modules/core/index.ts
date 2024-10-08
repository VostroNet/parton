/* eslint-disable functional/no-loop-statements */
import { promisify } from 'util';

import { stitchSchemas } from '@graphql-tools/stitch';
import { createSchema } from '@vostro/gqlize';
import GQLManager from '@vostro/gqlize/lib/manager';
import bodyParser from "body-parser";
import { GraphQLSchema } from 'graphql';
import passport, { PassportStatic } from 'passport';
import { Op } from 'sequelize';

import { System } from '../../system';
import { Role } from '../../types/models/models/role';
import { User } from '../../types/models/models/user';
import { Context } from '../../types/system';
import waterfall from '../../utils/waterfall';
import { CliEvent, ClIModule } from '../cli';
import { createOptions, DataEvent, DataModule, getDatabase } from '../data';
import { createContextFromRequest, ExpressEvent, ExpressModuleEvents } from '../express';

import { generateTypes } from './functions/generate-types';
import models from './models';
import { RoleDoc } from './types';
import { SystemEvent } from '../../types/events';

export enum CoreModuleEvent {
  GraphQLSchemaConfigure = 'core:graphql-schema:configure',
  GraphQLSchemaCreate = 'core:graphql-schema:create',
  AuthProviderRegister = 'core:auth:provider:register',
  AuthLogoutRequest = 'core:auth:logout:request',
  AuthLoginRequest = 'core:auth:login:request',
  AuthLoginSuccessResponse = 'core:auth:login:success',
}

export interface CoreModuleEvents {
  [CoreModuleEvent.GraphQLSchemaConfigure]?: (
    role: Role,
    core: System,
  ) => Promise<GraphQLSchema>;
  [CoreModuleEvent.GraphQLSchemaCreate]?: (
    schema: GraphQLSchema,
    role: Role,
    core: System,
  ) => Promise<GraphQLSchema>;
  [CoreModuleEvent.AuthProviderRegister]?: (passport: PassportStatic, system: System) => Promise<IAuthProvider>;
  [CoreModuleEvent.AuthLoginSuccessResponse]?: (loginResponse: any, user: User, context: Context) => Promise<any>
}

export interface IAuthProvider {
  name: string;
  isBearer?: boolean;
}

export interface ICoreModule
  extends DataModule,
  ClIModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  schemas: {
    [key: string]: GraphQLSchema;
  };
}

export const coreModule: ICoreModule = {
  name: 'core',
  dependencies: ['data'],
  schemas: {},
  models,
  ignore: ['schemas', 'models'],
  [SystemEvent.Initialize]: async (system: System) => {
    system.setOptions(CoreModuleEvent.GraphQLSchemaConfigure, {
      ignoreReturn: true,
    });
    return system;
  },
  // [SystemEvent.ContextCreate]: async (context, system) => {

  //   return context;
  // },
  [DataEvent.Loaded]: async (system, gqlManager) => {

    // system.setOptions(CoreModuleEvent.GraphQLSchemaCreate, {
    //   ignoreReturn: true,
    // });
    const db = await getDatabase(system);
    const { Role } = db.models;
    const roles = await Role.findAll(
      createOptions(system, {
        override: true,
      }),
    );

    // const {roles} = (system.config as CoreConfig);
    await waterfall(roles, async (role: Role) => {
      const roleDoc: RoleDoc = role.doc;
      const schema = await buildSchemaFromDatabase(system, roleDoc, gqlManager);
      if (!schema) {
        system.logger.error(`no schema returned for role ${role.name}`);
        return;
      }
      const schemas = await system.all<GraphQLSchema>(
        CoreModuleEvent.GraphQLSchemaConfigure,
        role,
        system,
      );
      system.logger.info(`stitching schemas for role ${role.name}`, schemas);
      const newSchema = stitchSchemas({
        subschemas: [
          schema, ...schemas.filter((s) => s)
        ],
      });
      if (!newSchema) {
        system.logger.error(`no stitched schema returned for role ${role.name}`);
        return;
      }

      system.get<ICoreModule>('core').schemas[role.name] = newSchema;
      await system.execute(
        CoreModuleEvent.GraphQLSchemaCreate,
        newSchema,
        role,
        system,
      );
    });
    return;
  },
  [CliEvent.Configure]: async (args, context, system) => {
    if (args._.indexOf('generate-types') > -1) {
      await generateTypes(system, context, system.cwd, args.output as string);
    }
    // if(args._.indexOf('start-server') > -1) {
    //   await system.execute(SystemEvent.Ready, system);
    // }
  },
  [ExpressEvent.Initialize]: async (express, system: System) => {
    const providers = await system.all<IAuthProvider>(
      CoreModuleEvent.AuthProviderRegister,
      passport,
      system,
    );
    const bearerProviders = providers
      .filter((p) => p.isBearer)
      .map((b) => b.name);

    passport.serializeUser(function (user: any, done) {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const db = await getDatabase(system);
        const { User, Role } = db.models;
        // const transaction = await db.transaction();
        const user = await User.findOne(
          createOptions(
            {
              // transaction
              override: true,
            },
            {
              where: {
                id: {
                  [Op.eq]: id,
                },
              },
              include: [
                {
                  required: true,
                  model: Role,
                  as: 'role',
                },
              ],
              override: true,
            },
          ),
        );
        // await transaction.commit();
        return done(undefined, user);
      } catch (err) {
        return done(err, undefined);
      }
    });

    const jsonParser = bodyParser.json();
    express.use(passport.initialize());
    express.use(passport.session());
    express.use(async (req: any, res: any, next: any) => {
      if (req.logout) {
        req.logoutAsync = promisify(req.logout);
      }
      return next();
    });
    express.get('/auth.api/logout', async (req, res) => {
      const context = await createContextFromRequest(req, system, true);
      const user = await context.getUser();
      if (user) {
        await system.execute(CoreModuleEvent.AuthLogoutRequest, user, context);
        // this feels unnecessary
        try {
          await (req as any).logoutAsync({
            keepSessionInfo: false,
          });
        } catch (err: any) {
          system.logger.error(err);
        }
      }
      return res.redirect('/');
    });
    express.post('/auth.api/login', jsonParser, async (req, res) => {
      // TODO: Login Event chain?
      const context = await createContextFromRequest(req, system, true);
      try {
        // TODO: apply type to response
        const response = await system.execute(CoreModuleEvent.AuthLoginRequest, req.body, context);
        if (response?.success) {
          //todo: ensure context is set properly and has user available
          const result = await system.execute(CoreModuleEvent.AuthLoginSuccessResponse, response, context.getUser(), context);
          return res.status(200)
            .json(result);
        }
        return res.status(400)
          .json(response);
      } catch (err: any) {
        system.logger.error(err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }
    });
    express.use(async (req, res, next) => {
      for (const bearerProvider of bearerProviders) {
        try {
          const response = (await authenticateAsync(passport,
            bearerProvider,
            req,
            res,
          )) as any;
          if (response?.user) {
            await assignUserToRequest(req, response.user);
            break;
          }
        } catch (err) {
          system.logger.error(`${bearerProvider} failed`, err);
        }
      }
      return next();
    });
    return express;
  },
};

export function authenticateAsync(passport: PassportStatic,
  strategy: string | passport.Strategy | string[],
  req: any,
  res: any,
  session = false,
) {
  return new Promise((resolve, reject) => {
    try {
      return passport.authenticate(
        strategy,
        { session },
        (err: any, user: any, info: any) => {
          if (!err) {
            return resolve({ user, info });
          }
          return reject(err);
        },
      )(req, res, (err: any) => {
        if (err) {
          return reject(err);
        }
        return reject(new Error('Unknown Error - next was called'));
      });
    } catch (err) {
      return reject(err);
    }
  });
}

export async function assignUserToRequest(req: any, user: any) {
  req.user = user;
  const role = await user.getRole({ override: true });
  req.role = role;

  req.getUser = () => {
    return user;
  };
  req.getRole = () => role;
  return;
}

export async function buildSchemaFromDatabase(
  _: System,
  roleDoc: RoleDoc,
  gqlManager: GQLManager,
) {
  if (!roleDoc) {
    throw new Error('no role schema provided');
  }
  const roleSchema = roleDoc.schema || {};
  if (!roleSchema) {
    throw new Error('no role schema provided');
  }

  const permissionFunc = {
    model(modelName: string | number) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (roleSchema.models) {
        const m = roleSchema.models[modelName];
        if (m?.w || m?.r) {
          return true;
        }
      }
      return false;
    },
    field(modelName: any, fieldName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (roleSchema.models) {
        const m = roleSchema.models[modelName];
        if (m?.w || m?.r) {
          return true;
        }
        if (m?.f) {
          const fp = m.f[fieldName];
          if (fp?.w || fp?.r) {
            return true;
          }
        }
      }
      return false;
    },
    relationship(modelName: any, relationshipName: any, targetModelName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[relationshipName];
        if ((fp?.w || fp?.r) && roleSchema.models[targetModelName]) {
          return true;
        }
      }
      return false;
    },
    query(modelName: string | number) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      return false;
    },
    queryClassMethods(modelName: any, methodName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.f && m.cm) {
        const fp = m.cm[methodName];
        if (fp?.w || fp?.r) {
          return true;
        }
      }
      return false;
    },
    queryInstanceMethods(modelName: any, methodName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }

      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[methodName];
        if (fp?.w || fp?.r) {
          return true;
        }
      }
      return false;
    },
    mutation(modelName: string | number) {
      if (roleSchema.w || roleSchema.d || roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.d || m.u) {
        return true;
      }
      return false;
    },
    mutationUpdate(modelName: any) {
      if (roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.u) {
        return true;
      }
      return false;
    },
    mutationUpdateInput(modelName: any, fieldName: any) {
      if (roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];

      if (m?.u) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[fieldName];
        if (fp?.u) {
          return true;
        }
      }
      return false;
    },
    mutationCreate(modelName: any) {
      if (roleSchema.w) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w) {
        return true;
      }
      return false;
    },
    mutationCreateInput(modelName: any, fieldName: any) {
      if (roleSchema.w) {
        return true;
      }
      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[fieldName];
        if (fp?.w) {
          return true;
        }
      }
      return false;
    },
    mutationDelete(modelName: any) {
      if (roleSchema.d) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.d) {
        return true;
      }
      return false;
    },
    mutationClassMethods(modelName: any, methodName: any) {
      if (roleSchema.d) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.d) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[methodName];
        if (fp?.d) {
          return true;
        }
      }
      return false;
    },
    subscription(modelName: any, hookName: any) {
      if (roleSchema.s) {
        if (roleSchema.s[hookName]) {
          return true;
        }
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.s && m?.s[hookName]) {
        return true;
      }
      return false;
    },
    mutationExtension(modelName: any) {
      if (roleSchema.ext) {
        const ext = roleSchema.ext[modelName];
        if (ext?.w || ext?.d || ext?.u) {
          return true;
        }
      }
      return false;
    },
    queryExtension(modelName: any) {
      if (roleSchema.ext) {
        const ext = roleSchema.ext[modelName];
        if (ext?.w || ext?.r || ext?.u) {
          return true;
        }
      }
      return false;
    },
  };
  const schema = await createSchema(gqlManager, {
    permission: permissionFunc,
    // ...schemaConfig,
  });
  return schema;
}

export default coreModule;
