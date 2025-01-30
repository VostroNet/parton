import { ISlice, Loaf, LoafEvent, Logger } from '@vostro/sandwich';

import { LRUCache } from 'lru-cache'

// import { createOptions, getDatabase } from './modules/data';
import { Config } from './types/config';
import { SystemContextRef, SystemEvent } from './types/events';
import { Role } from './types/models/models/role';
import { User } from './types/models/models/user';
import { Context } from './types/system';
import type { Site } from './types/models/models/site';
import type { SiteRole } from './types/models/models/site-role';
// import DatabaseContext from './types/models';
import { IRole, ISite, IUser } from './modules/core/types';


import { createNamespace, getNamespace } from 'cls-hooked';
import Chains from '@vostro/sandwich/lib/utils/chains';

export const clsSession = createNamespace("parton");



function createHookProxy(sys: System): ISlice {
  return {
    name: "proxy",
    [LoafEvent.Initialize]: async (core: Loaf, slice: ISlice) => {
      await core.execute(SystemEvent.Initialize, sys, slice);
      return core;
    },
    [LoafEvent.Ready]: async (core: Loaf, slice: ISlice) => {
      await core.execute(SystemEvent.Ready, sys, slice);
      return core;
    },
    [LoafEvent.Shutdown]: async (core: Loaf, slice: ISlice) => {
      await core.execute(SystemEvent.Shutdown, sys, slice);
      return core;
    },
    [LoafEvent.UncaughtError]: async (core: Loaf, error: Error) => {
      await core.execute(SystemEvent.UncaughtError, sys, error);
      return core;
    },
    [LoafEvent.UnhandledRejection]: async (core: Loaf, error: Error) => {
      await core.execute(SystemEvent.UnhandledRejection, sys, error);
      return core;
    },
  };
}

export class System extends Loaf {
  private readonly config: Config;
  readonly cache: LRUCache<string, any>;
  constructor(config: Config) {
    super(config);
    const slices = [].concat([...config.slices, createHookProxy(this)]);

    this.jam.slices = slices;
    this.config = config;
    this.config.slices = slices;
    this.cache = new LRUCache({
      maxSize: 5000,
      ttl: 1000 * 60 * 5,
      updateAgeOnGet: true,
    });

  }
  getConfig = <T extends Config>() => {
    return this.config as T;
  };
  readonly start = async () => {
    await this.load();
    await this.initialize();
    await this.configure();
    await this.configureComplete();
    await this.ready();
  };
  readonly execute = async<T>(...args: [string, any, ...unknown[]]) => {
    return withSession(async () => {
      return Chains.execute<T>(this, ...args);
    }, this)
  }
  readonly sync = async<T>(...args: [string, any, ...unknown[]]) => {
    return withSession(async () => {
      return Chains.sync<T>(this, ...args);
    }, this)
  }
  readonly all = async <T>(...args: [string, any, ...unknown[]]) => {
    return withSession(async () => {
      return Chains.all<T>(this, ...args);
    }, this) as Promise<T[]>
  }
  readonly condition = async <T1, T2>(...args: [string, (o: T2) => Promise<boolean>, T1, ...unknown[]]) => {
    return withSession(async () => {
      return Chains.condition<T1, T2>(this, ...args);
    }, this)
  }
  readonly configure = () => {
    return this.execute(SystemEvent.Configure, this);
  }
  readonly configureComplete = () => {
    return this.execute(SystemEvent.ConfigureComplete, this);
  }

}

export interface SystemContext extends Context {
  system: System;
  role: Role;
  override: boolean;
  user?: User | undefined;
  site: Site;
  siteRole: SiteRole;
}
// export function getLoggerFromSystem(system: System) : Logger {
//   return system.logger;
// }

export function getLoggerFromContext(context: Context): Logger {
  return getSystemFromContext(context).logger;
}


export function getSystemFromContext(context: Context): System {
  if (!context.system) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error('system is not defined');
  }
  return context.system;
}


export async function createContext<TUser>(
  system: System,
  user?: IUser<TUser>,
  site?: ISite,
  role?: IRole,
  override = false,
  initContext?: Context | undefined,
  ref?: SystemContextRef | undefined,
): Promise<Context> {

  if (!role && override) {
    role = {
      id: -1,
      name: 'system',
    } as any;
    if (!user) {
      user = {
        id: -1,
        userName: 'system',
        getRole: () => role,
      } as any
    }

  }
  const context: Context = {
    system,
    role,
    override,
    user,
    getUser: () => user,
    site,
    ...initContext,
  };
  return system.execute(
    SystemEvent.ContextCreate,
    context,
    system,
    ref,
  );
}





export function withSession<T>(cb: () => Promise<T>, system: System, context?: Context): Promise<T> {
  const session = getNamespace("parton");
  return session.runPromise<T>(() => {
    session.set("system", system);
    if (context) {
      session.set("context", context);
    }
    return cb();
  });
}

export function withContext<T>(context: Context, cb: () => Promise<T>): Promise<T> {
  const session = getNamespace("parton");
  return session.runPromise<T>(() => {
    session.set("context", context);
    return cb();
  });
}
export function getContextFromSession(): Context {
  const session = getNamespace("parton");
  return session.get("context");
}
export function getSystemFromSession(): System {
  const session = getNamespace("parton");
  return session.get("system");
}