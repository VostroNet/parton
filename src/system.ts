import { ISlice, Loaf, LoafEvent } from '@vostro/sandwich';

import { createOptions, getDatabase } from './modules/data';
import { Config } from './types/config';
import { SystemEvent } from './types/events';
import { Role } from './types/models/models/role';
import { User } from './types/models/models/user';
import { Context } from './types/system';

function createHookProxy(sys: System) {
  return {
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
  constructor(config: Config) {
    super(config);
    this.config = config;
    config.slices.push(createHookProxy(this));
  }
  getConfig = <T extends Config>() => {
    return this.config as T;
  };
}

export async function createContext(
  system: System,
  user?: User,
  roleName = 'system',
  override = false,
  transaction?: any,
): Promise<Context> {
  const db = await getDatabase(system);
  const { Role } = db.models;
  let role: Role | undefined = undefined;
  if (user?.role) {
    role = user.role;
  } else if (user) {
    role = await user.getRole(createOptions({ override: true }));
  } else if (roleName) {
    role = await Role.findOne(
      createOptions({
        override: true,
        where: { name: roleName, enabled: true },
      }),
    );
  }

  if (!role && override) {
    role = {
      name: roleName || 'system',
    } as any;
  }

  const context: Context = {
    system,
    role,
    override,
    transaction,
    user,
  };
  return system.execute(
    SystemEvent.ContextCreate,
    context,
    system,
    role,
    override,
    transaction,
  );
}
