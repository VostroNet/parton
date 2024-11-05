
import { exportJWK, importJWK, KeyLike } from "jose";
import {Strategy as JwtStrategy} from "passport-jwt";

import { Config } from "../../../types/config";
import { IModule } from "../../../types/system";
import { fetchWithTimeout } from "../../../utils/fetch";
import { DataModulesModels } from "../../data";
import { createContextFromRequest, ExpressEvent, ExpressModuleEvents } from "../../express";

import models from "./models";
import { getUserFromToken } from "./utils";
import { CoreModuleEvent, CoreModuleEvents } from "../../core/types";


export interface JwtAuthModule extends IModule, CoreModuleEvents, ExpressModuleEvents, DataModulesModels {

}
export interface JwtConfig extends Config {
  auth?: {
    jwt?: {
      source?: string;
      publicKey: KeyLike;
      privateKey: KeyLike;
      algorithm?: string;
      expiresIn?: string;
    },
    jwks?: {
      url: string;
      autoCreateUser?: boolean;
    }
  }
}
export interface JwksEndpoint {
  keys: KeyLike[];
}


export const jwtAuthModule: JwtAuthModule = {
  name: 'jwt-auth',
  dependencies: ["core"],
  models,
  [CoreModuleEvent.AuthProviderRegister]: async (passport, system) => {
    const authConfig = system.getConfig<JwtConfig>()
    passport.use(
      new JwtStrategy({
        // secretOrKey: key,
        secretOrKeyProvider: async(request, rawJwtToken, done) => {
          if(authConfig?.auth?.jwt?.publicKey) {
            return done(null, authConfig?.auth?.jwt?.publicKey);
          }
          if (authConfig?.auth?.jwks) {
            const response = await fetchWithTimeout(authConfig?.auth?.jwks, {
              timeout: 5000,
            });
            const jwks = (await response.json()) as JwksEndpoint;
            if(jwks?.keys && jwks.keys.length > 0) {
              const key = await importJWK(jwks.keys[0] as any, "RS256");
              return done(null, key);
            }
          }
          return done(new Error("No public key found"));

        },
        jwtFromRequest: (req: any) => {
          let token = null;
          if (req?.query?.jwt) {
            token = req.query.jwt;
            delete req.query.jwt;
          } else if (req.headers?.authorization) {
            token = req.headers.authorization.replace("Bearer ", "");
          }
          return token as string | null;
        },
        passReqToCallback: true,
      }, async(req: any, token: any, done: any) => {
        try {
          const context = await createContextFromRequest(req, system, true);
          const user = await getUserFromToken(token, system, context);
          if (user) {
            return done(null, user, {scope: "all"});
          }
          return done(null, false);
        } catch (err) {
          return done(err);
        }
      }
    ));
    return {
      name: "jwt",
      isBearer: true,
    };
  },
  [ExpressEvent.Initialize]: async(express, system) => {
    const authConfig = system.getConfig<JwtConfig>()
    const publicKey = authConfig?.auth?.jwt?.publicKey;
    if (publicKey) {
      const key = await exportJWK(publicKey);
      express.get("/.well-known/jwks.json", (req, res) => {
        return res.json({
          keys: [
            key,
          ],
        });
      });
    }
    return express;
  },
  [CoreModuleEvent.AuthLoginSuccessResponse]: async(loginResponse, user: any, context) => {
    const jwtToken = await user.jwtToken({}, context);
    return {
      ...loginResponse,
      jwtToken,
    }
  }
}

/* 

import { generateKeyPair, exportJWK } from "jose";
import fs from "fs";
import { promisify } from "util";
import path from "path";
const writeFileAsync = promisify(fs.writeFile);


(async() => {
  const {publicKey, privateKey} = await generateKeyPair("ES256", {
  });
  const strPublicKey = encode(await exportJWK(publicKey));
  const strPrivateKey = encode(await exportJWK(privateKey));
  await writeFileAsync(path.resolve(process.cwd(), "./jwt-public.txt"), strPublicKey);
  await writeFileAsync(path.resolve(process.cwd(), "./jwt-private.txt"), strPrivateKey);
  console.log("done");
})();


function encode(obj: object) {
  const str = JSON.stringify(obj);
  console.log(str);
  const buf = Buffer.from(str, "utf-8");
  return buf.toString("base64");
}

*/

export default jwtAuthModule;