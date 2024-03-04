import minimist from 'minimist';

import { System } from '../system';
import { SystemEvent } from '../types/events';
import { Context, IModule } from '../types/system';
export enum CliEvent {
  Initialize = 'cli:initialize',
  Configure = 'cli:configure',
}

export type ClIModuleEvents = {
  [CliEvent.Initialize]?: (core: System) => Promise<void>;
  [CliEvent.Configure]?: (
    program: minimist.ParsedArgs,
    context: Context,
    system: System,
  ) => Promise<void>;
};

export interface ClIModule extends IModule, ClIModuleEvents {}

export const clIModule: ClIModule = {
  name: 'cli',
  dependencies: [],
  [SystemEvent.Initialize]: async (core) => {
    core.setOptions(CliEvent.Configure, {
      ignoreReturn: true,
    });
    await core.execute(CliEvent.Initialize, core);
    return core;
  },
  // [HttpEventType.Request]: async (req, res, core) => {
  //   const expressApp = (core.modules.express as ExpressModule).express;
  //   expressApp(req, res);
  // }
};
export default clIModule;
