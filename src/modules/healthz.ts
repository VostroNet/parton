import { System } from '../system';
import { IModule } from '../types/system';
import test from "./express";

import {
  ExpressEvent,
  ExpressModuleEvents,
} from './express';

export enum HealthzEventType {
  Check = 'healthz:check',
}

export type HealthzEvents = {
  [key in HealthzEventType]?: (core: System) => Promise<boolean>;
};

// export interface IHealthzModule
//   extends IModule,
//     CoreModuleEvents,
//     ExpressModuleEvents {
// }

export const healthzModule: IModule & ExpressModuleEvents = {
  name: 'healthz',
  dependencies: ['express'],
  [ExpressEvent.Initialize]: async (express, system) => {
    express.get('/healthz', async (req, res) => {
      const status = await system.condition(HealthzEventType.Check, async (result: boolean) => {
        return result; //we use conditional event to skip remaining handlers if result is false
      }, system);
      if (status) {
        return res.status(200).send("OK");
      } else {
        return res.status(500).send("Not OK");
      }
    });
    return express;
  },
};
export default healthzModule;
