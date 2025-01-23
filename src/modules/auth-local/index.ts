// import bcrypt from 'bcrypt';
import { Strategy as LocalStrategy } from 'passport-local';

import { createContext, System } from '../../system';
import { IModule } from "../../types/system";
import { createOptions, DataModulesModels, getDatabase } from '../data';

import models from './models';
import DatabaseContext from '../../types/models';
import { CoreModuleEvent, CoreModuleEvents } from '../core/types';
import { createContextFromRequest, ExpressEvent, ExpressModuleEvents } from '../express';
import passport from 'passport';
import bodyParser from "body-parser";
import { Request } from 'express';

export interface LocalAuthModule extends IModule, CoreModuleEvents, DataModulesModels,ExpressModuleEvents {

}

export const LocalAuthModule: LocalAuthModule = {
  name: 'auth-local',
  dependencies: ["core", "auth"],
  models,
  [CoreModuleEvent.AuthProviderRegister]: async (passport, system) => {
    passport.use(
      new LocalStrategy({
        passReqToCallback: true
      }, async (req: Request, username, password, done) => {
        try {
          const context = await createContextFromRequest(req, system, true);
          //const context = await createContext(system, undefined, undefined, undefined, true);        
          const db = await getDatabase<DatabaseContext>(system);
          const { UserAuth } = db.models;
          const user = await UserAuth.loginWithUsernamePassword({ username, password }, context);
          
          if (user) {
            await system.execute(CoreModuleEvent.AuthLoginSuccessResponse, {
              type: "local",
              user,
              ip: req.ip
            }, context);
            return done(null, user, { scope: 'all' });
          }
          await system.execute(CoreModuleEvent.AuthLoginFailureResponse, {
            type: 'local',
            ref: {
              username,
            },
            ip: req.ip,
          }, context);
          return done(null, false);
        } catch (err) {
          return done(err);
        }
      }),
    );
    return {
      name: "Local",
    };// as IAuthProvider;
  },
  // [CoreModuleEvent.AuthLoginRequest]: async(loginResponse, user, context) => {




  //   return loginResponse;
  // },
  
  [ExpressEvent.Initialize]: async (express, system: System) => {
    const jsonParser = bodyParser.json();
    express.post('/auth.api/login', jsonParser, async (req, res) => {
      passport.authenticate('local', async (err, user, info) => {
        if (err) {
          return res.status(500).json({ error: err });
        }
        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }
        req.logIn(user, async (err) => {
          if (err) {
            return res.status(500).json({ error: err });
          }
          // const context = await createContext(system, undefined, undefined, undefined, true);
          const userInfo = {
            id: user.id,
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            disabled: user.disabled,
            role: {
              id: user.role.id,
              name: user.role.name,
            }
          };
          // const loginResponse = await system.execute(CoreModuleEvent.AuthLoginSuccessResponse, user, context);
          return res.json(userInfo);
        });
      })(req, res);
    });
    return express;
  }
}
export default LocalAuthModule;