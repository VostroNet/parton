import { ISlice } from '@vostro/sandwich';

import { System } from '../system';

import { Role } from './models/models/role';
import { Context } from './system';

export enum SystemEvent {
  Initialize = 'system:init',
  Ready = 'system:rdy',
  Shutdown = 'system:signal:-1',
  ContextCreate = 'system:context:create',
  UncaughtError = 'system:error',
  UnhandledRejection = 'system:error:rejected-fly',
}

export type SystemEvents = {
  readonly [SystemEvent.Initialize]?: (
    core: System,
    slice: ISlice,
  ) => Promise<System>;
  readonly [SystemEvent.Ready]?: (
    core: System,
    slice: ISlice,
  ) => Promise<System>;
  readonly [SystemEvent.Shutdown]?: (
    core: System,
    slice: ISlice,
  ) => Promise<System>;
  readonly [SystemEvent.ContextCreate]?: (
    context: Context,
    core: System,
    role: Role,
    override: boolean,
    transaction: any,
  ) => Promise<Context>;
  readonly [SystemEvent.UncaughtError]?: (
    core: System,
    error: Error,
  ) => Promise<System>;
  readonly [SystemEvent.UnhandledRejection]?: (
    core: System,
    error: Error,
  ) => Promise<System>;
};
