import { IRole } from '../modules/core/types';
import { System } from '../system';
import { Context, IModule } from './system';

export enum SystemEvent {
  Initialize = 'system:init',
  Configure = 'system:cfg',
  ConfigureComplete = 'system:cfg:complete',
  Ready = 'system:rdy',
  Shutdown = 'system:signal:-1',
  ContextCreate = 'system:context:create',
  UncaughtError = 'system:error',
  UnhandledRejection = 'system:error:rejected-fly',
}

export type SystemEvents = {

  [SystemEvent.Initialize]?(
    core: System,
    module: IModule,
  ): Promise<System>;

  [SystemEvent.Ready]?(
    core: System,
    module: IModule,
  ): Promise<System>;
  [SystemEvent.Shutdown]?(
    core: System,
    module: IModule,
  ): Promise<System>;
  [SystemEvent.ContextCreate]?(
    context: Context,
    system: System,
    ref: SystemContextRef | undefined,
    module: IModule,
  ): Promise<Context>;
  [SystemEvent.UncaughtError]?(
    core: System,
    error: Error,
    module: IModule,
  ): Promise<System>;
  [SystemEvent.UnhandledRejection]?(
    core: System,
    error: Error,
    module: IModule,
  ): Promise<System>;
  // --- 
  readonly [SystemEvent.Initialize]?: (
    core: System,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.Configure]?: (
    core: System,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.ConfigureComplete]?: (
    core: System,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.Ready]?: (
    core: System,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.Shutdown]?: (
    core: System,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.ContextCreate]?: (
    context: Context,
    system: System,
    ref: SystemContextRef | undefined,
    module: IModule,
  ) => Promise<Context>;
  readonly [SystemEvent.UncaughtError]?: (
    core: System,
    error: Error,
    module: IModule,
  ) => Promise<System>;
  readonly [SystemEvent.UnhandledRejection]?: (
    core: System,
    error: Error,
    module: IModule,
  ) => Promise<System>;
};


export interface SystemContextRef {
  hostname?: string | undefined;
}