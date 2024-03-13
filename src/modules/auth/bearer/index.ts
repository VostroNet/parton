import bcrypt from 'bcrypt';
import { Strategy as BearerStrategy } from 'passport-http-bearer';

import { createContext } from '../../../system';
import { IModule } from "../../../types/system";
import { CoreModuleEvent, CoreModuleEvents } from "../../core";
import { createOptions, DataModulesModels, getDatabase } from '../../data';

import models from './models';

export interface BearerAuthModule extends IModule, CoreModuleEvents, DataModulesModels {

}

export const bearerAuthModule: BearerAuthModule = {
  name: 'bearer',
  dependencies: ["core"],
  models,
  [CoreModuleEvent.AuthProviderRegister]: async (passport, system) => {
    passport.use(
      new BearerStrategy(async (token, done) => {
        try {
          const db = await getDatabase(system);
          const { UserAuth, Role } = db.models;
          const context = await createContext(system, undefined, "system", true);

          const userAuths = await UserAuth.findAll(
            createOptions(context, {
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
    return {
      name: "bearer",
      isBearer: true,
    };// as IAuthProvider;
  }
}
export default bearerAuthModule;