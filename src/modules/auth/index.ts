
import { Op } from 'sequelize';
import DatabaseContext from '../../types/models';
import { User } from '../../types/models/models/user';
import { IModule } from '../../types/system';
import { CoreModuleEvent, CoreModuleEvents, IAuthProvider, IUser } from '../core/types';
import { buildOptions, DataModulesModels, getDatabase } from '../data';
import models from './models';
import passport, { PassportStatic } from 'passport';
import { createContextFromRequest, ExpressEvent, ExpressModuleEvents } from '../express';
import { promisify } from 'util';
import { System } from '../../system';
export interface AuthModule
  extends IModule,
  DataModulesModels,
  CoreModuleEvents,
  ExpressModuleEvents
  {

  }
export const authModule: AuthModule = {
  name: 'auth',
  dependencies: ['core', 'data'],
  models: models,
  [CoreModuleEvent.UserSerialize]: async (user: IUser<User>, system: System) => {
    return `${user.id}`;
  },
  [CoreModuleEvent.UserDeserialize]: async (serialized: string, system: System) => {
    const db = await getDatabase<DatabaseContext>(system);
    const { Role } = db.models;
    // const transaction = await db.transaction();
    const user: IUser<User> = (await db.models.User.findOne(
      buildOptions(
        {
          // transaction
          override: true,
        },
        {
          where: {
            id: {
              [Op.eq]: serialized,
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
    )) as any;
    return user;
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

    passport.serializeUser(async function <T>(user: IUser<T>, done) {
      const serialized = await system.execute(CoreModuleEvent.UserSerialize, user, system);
      done(null, serialized);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await system.execute(CoreModuleEvent.UserDeserialize, id, system);
        return done(undefined, user);
      } catch (err) {
        return done(err, undefined);
      }
    });

    // const jsonParser = bodyParser.json();
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
    // express.post('/auth.api/login', jsonParser, async (req, res) => {
    //   // TODO: Login Event chain?
    //   const context = await createContextFromRequest(req, system, true);
    //   try {
    //     // TODO: apply type to response
    //     const response = await system.execute(CoreModuleEvent.AuthLoginRequest, {success:false}, req.body, context);
    //     if (response?.success) {
    //       //todo: ensure context is set properly and has user available
    //       const result = await system.execute(CoreModuleEvent.AuthLoginSuccessResponse, response, context.getUser(), context);
    //       return res.status(200)
    //         .json(result);
    //     }
    //     return res.status(400)
    //       .json(response);
    //   } catch (err: any) {
    //     system.logger.error(err);
    //     return res.status(500).json({
    //       success: false,
    //       error: err.message,
    //     });
    //   }
    // });
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
//TODO: overhaul this
export async function assignUserToRequest(req: any, user: any) {
  req.user = user;
  req.role = user.role || await user?.getRole?.({ override: true });
  req.getUser = () => {
    return user;
  };
  req.getRole = () => req.role;
  return;
}


export default authModule;