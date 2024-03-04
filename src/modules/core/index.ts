import { stitchSchemas } from '@graphql-tools/stitch';
import { createSchema } from '@vostro/gqlize';
import GQLManager from '@vostro/gqlize/lib/manager';
import bcrypt from 'bcrypt';
import { GraphQLSchema } from 'graphql';
import passport from 'passport';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Op } from 'sequelize';

import { System } from '../../system';
import { Role } from '../../types/models/models/role';
import waterfall from '../../utils/waterfall';
import { CliEvent, ClIModule } from '../cli';
import { createOptions, DataEvent, DataModule, getDatabase } from '../data';
import { ExpressEvent, ExpressModuleEvents } from '../express';

import { generateTypes } from './functions/generate-types';
import models from './models';
import { RoleDoc } from './types';

export enum CoreModuleEvent {
  GraphQLSchemaConfigure = 'core:graphql-schema:configure',
  GraphQLSchemaCreate = 'core:graphql-schema:create',
  AuthBearerProviderRegister = 'core:auth:bearer-provider:register',
  AuthLogoutRequest = 'core:auth:logout:request',
  AuthLoginRequest = 'core:auth:login:request',
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
  ) => Promise<void>;
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
  // [SystemEvent.ContextCreate]: async (context, system) => {

  //   return context;
  // },
  [DataEvent.Loaded]: async (system, gqlManager) => {
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
      const schemas = await system.all<GraphQLSchema>(
        CoreModuleEvent.GraphQLSchemaConfigure,
        role,
        system,
      );
      const newSchema = stitchSchemas({
        subschemas: [schema, ...schemas.filter((s) => s)],
      });

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
    const bearerProviders = await system.all<string>(
      CoreModuleEvent.AuthBearerProviderRegister,
      system,
    );

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
    passport.use(
      new BearerStrategy(async (token, done) => {
        try {
          const db = await getDatabase(system);
          const { UserAuth, Role } = db.models;

          const userAuths = await UserAuth.findAll(
            createOptions(
              {
                override: true,
              },
              {
                where: {
                  type: 'bearer',
                },
              },
            ),
          );
          if (!userAuths) {
            return done(null, false);
          }
          const userAuth = userAuths.find((ua) =>
            bcrypt.compareSync(token, ua.token),
          );
          if (userAuth) {
            const user = await userAuth.getUser(
              createOptions(
                {
                  override: true,
                },
                {
                  include: [
                    {
                      model: Role,
                      as: 'role',
                    },
                  ],
                },
              ),
            );
            return done(null, user, { scope: 'all' });
          }
          return done(null, false);
        } catch (err) {
          return done(err);
        }
      }),
    );
    express.use(passport.initialize());
    express.use(passport.session());
    express.get('/auth.api/logout', (req, res) => {
      req.logout(
        {
          keepSessionInfo: false,
        },
        (err: any) => {
          system.logger.error(err);
        },
      );
      res.redirect('/');
    });
    express.post('/auth.api/login', async (req, res, next) => {
      // TODO: Login Event chain?
      return next();
    });
    express.use(async (req, res, next) => {
      if (req.headers.Authorization || req.headers.authorization) {
        await waterfall(
          ['bearer'].concat(bearerProviders),
          async (bearerProvider, success) => {
            try {
              const response = (await authenticateAsync(
                bearerProvider,
                req,
                res,
              )) as any;
              if (response?.user) {
                await assignUserToRequest(req, response.user);
                return true;
              }
              return success;
            } catch (err) {
              system.logger.error(`${bearerProvider} failed`, err);
            }
            return false;
          },
        );
      }
      return next();
    });
    return express;
  },
};

export function authenticateAsync(
  strategy: string | passport.Strategy | string[],
  req: any,
  res: any,
) {
  return new Promise((resolve, reject) => {
    try {
      return passport.authenticate(
        strategy,
        { session: false },
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

async function assignUserToRequest(req: any, user: any) {
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
