import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { System } from '../system';
import { Config } from '../types/config';
import { SystemEvent } from '../types/events';
import { IModule } from '../types/system';

export enum HttpEventType {
  Initialize = 'http:initialize',
  Request = 'http:request',
  Ready = 'http:ready',
  Error = 'http:error',
}

export type HttpModuleEvents = {
  [HttpEventType.Initialize]?: (
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
  ) => Promise<void>;
  [HttpEventType.Ready]?: (
    httpServer: Server<typeof IncomingMessage, typeof ServerResponse>,
    core: System,
  ) => Promise<void>;
  [HttpEventType.Request]?: (
    req: IncomingMessage,
    res: ServerResponse,
    core: System,
  ) => Promise<void>;
};
export interface HttpModule extends IModule, HttpModuleEvents {
  httpServer?: Server<typeof IncomingMessage, typeof ServerResponse>;
}
export interface HttpConfig extends Config {
  http?: {
    port: number;
  };
}

const moduleName = 'http';

export const httpModule: HttpModule = {
  name: moduleName,
  dependencies: [
    {
      required: {
        incompatible: ['cli'],
      },
    },
  ],
  httpServer: undefined,
  [SystemEvent.Initialize]: async (core: System) => {
    const httpServer = createServer(async (req, res) => {
      try {
        await core.execute(HttpEventType.Request, req, res, core);
      } catch (err) {
        core.logger.error(moduleName, err as string);
        await core.execute(HttpEventType.Error, err, req, res, core);
      }
    });
    core.get<HttpModule>(moduleName).httpServer = httpServer;
    // (core.modules.http as HttpModule).httpServer = httpServer;
    core.logger.debug(moduleName, 'http server created');

    await core.execute(HttpEventType.Initialize, httpServer);
    return core;
  },
  [SystemEvent.Ready]: async <T extends System>(core: T) => {
    const { httpServer } = core.get<HttpModule>(moduleName);
    if (!httpServer) throw new Error('httpServer not found');
    const httpConfig = core.getConfig<HttpConfig>();
    httpServer.on('error', (e: any) => {
      core.logger.error('[HttpModule]', e);
      // if (e.code === 'EADDRINUSE') {
      //   core.logger.error('[HttpModule] Address in use, retrying...');
      //   console.error('Address in use, retrying...');
      //   setTimeout(() => {
      //     httpServer.close();
      //     httpServer.listen(httpConfig?.http?.port || 3000);
      //   }, 1000);
      // }
    });
    httpServer.listen(httpConfig?.http?.port || 3000);
    // await listenAsync(httpConfig?.http?.port || 3000, httpServer);
    await core.execute(HttpEventType.Ready, httpServer, core);
    return core;
  },
  [SystemEvent.Shutdown]: async (core: System) => {
    const { httpServer } = core.get<HttpModule>(moduleName);
    if (!httpServer) {
      throw new Error('httpServer not found');
    }
    httpServer.close();
    return core;
  },
};
// function listenAsync(port: number, httpServer: Server<typeof IncomingMessage, typeof ServerResponse>) {
//   return new Promise<void>((resolve, reject) => {
//     try {
//       httpServer.listen();
//       resolve();
//     } catch (err) {
//       reject(err);
//     }
//   });
// }
export default httpModule;
