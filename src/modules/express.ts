
import { IncomingMessage, ServerResponse } from 'http';
import { promisify } from 'util';

import type Express from 'express';
import express from 'express';
import expressSession, { SessionOptions } from 'express-session';

import { createContext, getSystemFromSession, System } from '../system';
import { Config } from '../types/config';
import { SystemEvent } from '../types/events';
import { HttpEventType, HttpModule } from './http';
import finalhandler from 'finalhandler';
import { Context, IModule } from '../types/system';
import { IUser } from './core/types';

export enum ExpressEvent {
  Initialize = 'express:initialize',
  Configure = 'express:configure',
  ConfigureComplete = 'express:configure:complete',
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


export interface ExpressModuleEvents {
  [ExpressEvent.Initialize]?(
    express: Express.Application,
    core: System,
    module: IModule,
  ): Promise<Express.Application>;
  [ExpressEvent.Configure]?(
    express: Express.Application,
    core: System,
    module: IModule,
  ): Promise<Express.Application>;
  [ExpressEvent.ConfigureComplete]?(
    express: Express.Application,
    core: System,
    module: IModule,
  ): Promise<void>;
  [ExpressEvent.Ready]?(
    express: Express.Application,
    core: System,
    module: IModule,
  ): Promise<void>;
  [ExpressEvent.Request]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.ExpressSessionConfigure]?(
    session: SessionOptions,
    core: System,
    module: IModule,
  ): Promise<SessionOptions>;
  [ExpressEvent.Use]?(
    req: Express.Request,
    res: Express.Response,
    system: System,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.Get]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.Post]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.Put]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.Patch]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;
  [ExpressEvent.Delete]?(
    req: Express.Request,
    res: Express.Response,
    module: IModule,
  ): Promise<boolean>;

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
    return system;
  },
  [SystemEvent.Configure]: async (system: System) => {
    const expressApp = system.get<IExpressModule>('express').express;
    await system.execute<Express.Application>(
      ExpressEvent.Configure,
      expressApp,
      system,
    );
    return system;
  },
  [SystemEvent.ConfigureComplete]: async (system: System) => {
    const expressApp = system.get<IExpressModule>('express').express;
    await system.execute<Express.Application>(
      ExpressEvent.ConfigureComplete,
      expressApp,
      system,
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


export async function createContextFromRequest(
  req: Express.Request,
  system?: System,
  override = false,
  initContext?: Context | undefined,
) {
  if (!system) {
    system = getSystemFromSession();
  }
  return createContext(
    system,
    req.user as IUser<any>,
    undefined,
    (req?.user as IUser<any>)?.role,
    override,
    initContext,
    req
  );;
}

