import { Server } from 'http';
import { System } from '../system';
import { Config } from '../types/config';
import { SystemEvent } from '../types/events';
import { IModule } from '../types/system';
import express from "express";


export type HealthzConfig = Config & {
  healthzPort?: number;
}

export enum HealthzEvent {
  Check = 'healthz:check',
}

export type HealthzEvents = {
  [HealthzEvent.Check]?(prevResult: boolean, core: System, module: IModule): Promise<boolean>;
  [HealthzEvent.Check]?: (prevResult: boolean, core: System, module: IModule) => Promise<boolean>;
};
export interface HealthzModule extends IModule {
  expressApp?: express.Express;
  server?: Server
}
//todo: alt attach to express module?
export const healthzModule: IModule = {
  name: 'healthz',
  dependencies: [],
  [SystemEvent.Ready]: async function (this: HealthzModule, system) {
    this.expressApp = express();
    this.expressApp.get('/healthz', async (req, res) => {
      const status = await system.condition(HealthzEvent.Check, async (result: boolean) => {
        return result; //we use conditional event to skip remaining handlers if result is false
      }, true, system);
      if (status) {
        return res.status(200).send("OK");
      } else {
        return res.status(500).send("Not OK");
      }
    });
    this.server = this.expressApp.listen(system.getConfig<HealthzConfig>().healthzPort || 9876);
    return system;
  },
  [System.Shutdown]: async function (this: HealthzModule, system,) {
    return new Promise((resolve, reject) => {
      this.server?.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(system);
        }
      });
    });
  }
};


export default healthzModule;
