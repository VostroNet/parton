
import { IncomingMessage, ServerResponse } from 'http';
import { promisify } from 'util';

import type Express from 'express';
import express from 'express';
import expressSession, { SessionOptions } from 'express-session';

import { createContext, System } from '../system';
import { Config } from '../types/config';
import { SystemEvent } from '../types/events';
import { User } from '../types/models/models/user';
import waterfall from '../utils/waterfall';

import { getDatabase } from './data';
import { HttpEventType, HttpModule } from './http';
import finalhandler from 'finalhandler';

export enum ExpressEvent {
  Initialize = 'express:initialize',
  Ready = 'express:ready',
  Request = 'express:request',
  Use = 'express:use',
  Get = 'express:get',
  Post = 'express:post',
  Put = 'express:put',
  Patch = 'express:patch',
  Delete = 'express:delete',
  ExpressSessionConfigure = 'express:session:configure',
}

const ExpressRequestTypes: { [key: string]: ExpressEvent } = {
  get: ExpressEvent.Get,
  post: ExpressEvent.Post,
  put: ExpressEvent.Put,
  patch: ExpressEvent.Patch,
  delete: ExpressEvent.Delete,
  // use: ExpressEvent.Use,
};

export interface ExpressModuleEvents {
  [ExpressEvent.Initialize]?: (
    express: Express.Application,
    core: System,
  ) => Promise<Express.Application>;
  [ExpressEvent.Ready]?: (
    express: Express.Application,
    core: System,
  ) => Promise<void>;
  [ExpressEvent.Request]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
  [ExpressEvent.ExpressSessionConfigure]?: (
    session: SessionOptions,
    core: System,
  ) => Promise<SessionOptions>;
  [ExpressEvent.Use]?: (
    req: Express.Request,
    res: Express.Response,
    system: System,
  ) => Promise<boolean>;
  [ExpressEvent.Get]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
  [ExpressEvent.Post]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
  [ExpressEvent.Put]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
  [ExpressEvent.Patch]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
  [ExpressEvent.Delete]?: (
    req: Express.Request,
    res: Express.Response,
  ) => Promise<boolean>;
}

export interface IExpressModule extends HttpModule, ExpressModuleEvents {
  express?: Express.Application;
  expressAsync?: (
    req: IncomingMessage,
    res: ServerResponse<IncomingMessage>,
  ) => Promise<void>;
}
function createExpressFunction(evt: ExpressEvent, core: System) {
  return async (
    req: Express.Request,
    res: Express.Response,
    next: () => void,
  ) => {
    //TODO: patch res.end to ensure that the promise resolves
    let called = false;
    await core.condition(
      evt,
      async (result: boolean) => {
        if (result === true) {
          called = true;
          return true;
        }
        return false;
      },
      req,
      res,
    );

    if (called === false) {
      return next();
    }
  };
}

interface ISessionOptions extends SessionOptions {
  resave: boolean;
  saveUninitialized: boolean;
}
export interface ExpressConfig extends Config {
  session?: ISessionOptions;
}

export const expressModule: IExpressModule = {
  name: 'express',
  dependencies: [
    'http',
    {
      optional: {
        incompatible: ['cli'],
      },
    },
  ],
  express: undefined,
  expressAsync: undefined,
  [SystemEvent.Initialize]: async (system: System) => {
    const expressApp = (system.get<IExpressModule>('express').express =
      express());
    system.get<IExpressModule>('express').expressAsync = promisify(
      expressApp,
    ) as (
      req: IncomingMessage,
      res: ServerResponse<IncomingMessage>,
    ) => Promise<void>;
    const sessionConfig = await system.execute<SessionOptions>(
      ExpressEvent.ExpressSessionConfigure,
      system.getConfig<ExpressConfig>().session,
      system,
    );
    expressApp.use(expressSession(sessionConfig));
    await system.execute<Express.Express>(
      ExpressEvent.Initialize,
      expressApp,
      system,
    );
    // await system.execute(ExpressEvent.Use, expressApp, system);
    await waterfall(
      Object.keys(ExpressRequestTypes),
      async (element: string) => {
        const evt = ExpressRequestTypes[element];
        system.setOptions(evt, {
          ignoreReturn: true,
        });
        (expressApp as any)[element](createExpressFunction(evt, system));
      },
    );

    expressApp.use((req, res) => {
      if (system.getConfig().devMode) {
        return res
          .status(404)
          .send(
            `404: ${Date.now()} - ${req.url} - ${req.method} - ${req.ip} - ${req.headers['user-agent']}  `,
          );
      }
      return res.status(404).send(`404: ${Date.now()}`);
    });
    return system;
  },
  //TODO: fix the any refs here
  [HttpEventType.Request]: (req: any, res: any, system) => {
    return new Promise((resolve: any, reject) => {
      let called = false;
      // ensure that the request is finished, so that the promise can resolve itself
      const finish = () => {
        if (!called) {
          called = true;
          resolve();
        }
      };
      const error = (err: any) => {
        if (!called) {
          called = true;
          reject(err);
        }
      };
      try {
        const { express } = system.get<IExpressModule>('express');
        if (!express) {
          return error(new Error('Express not initialized'));
        }
        const end = res.end;
        res.end = (...args: any[]) => {
          try {
            end.apply(res, args);
          } catch (err) {
            return error(err);
          }
          return finish();
        };
        return express(req, res, (err) => {
          finalhandler(req, res, {
            env: express.get('env'),
            onerror(err) {
              console.error(err.stack || err.toString());
              return reject(err);
            }
          })(err)
          return finish();
        });
      } catch (err) {
        return error(err);
      }
    });
  },
};
export default expressModule;



// export async function getDefaultRoleFromUri(
//   uri: string,
//   system: System,
// ): Promise<Role> {
//   const context: SystemContext = await createContext(system, undefined, undefined, undefined, true);
//   const db = await getDatabase(system);
//   const { Site, Role } = db.models;
//   const url = new URL(uri);

//   //TODO: check cache?

//   const site = await Site.getSiteByHostname(url.hostname, context);
//   if (!site) {
//     throw new Error('No default site found');
//   }
//   const siteRoles = await site.getSiteRoles(createOptions(context, {
//     where: {
//       doc: {
//         default: true,
//       }
//     },
//     include: [{
//       model: Role,
//       as: "role",
//       required: true,
//     }]
//   }));
//   if (siteRoles.length === 0) {
//     throw new Error('No default role found');
//   }

//   return siteRoles[0].role;
// }

export async function createContextFromRequest(
  req: Express.Request,
  system: System,
  override = false,
  transaction?: any,
) {
  const db = await getDatabase(system);
  const { Site } = db.models;
  const site = await Site.getSiteByHostname(req.hostname, { system, override: true, role: { name: "system" } });
  if (!site) {
    throw new Error('No default site found');
  }
  const context = await createContext(
    system,
    req.user as User,
    site,
    undefined,
    override,
    transaction,
  );
  return context;
}
