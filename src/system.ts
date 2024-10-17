import { ISlice, Loaf, LoafEvent, Logger } from '@vostro/sandwich';

import { createOptions, getDatabase } from './modules/data';
import { Config } from './types/config';
import { SystemEvent } from './types/events';
import { Role } from './types/models/models/role';
import { User } from './types/models/models/user';
import { Context } from './types/system';
import type { Site } from './types/models/models/site';
import type { SiteRole } from './types/models/models/site-role';
import DatabaseContext from './types/models';

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
  constructor(config: Config) {
    super(config);
    const slices = [].concat([...config.slices, createHookProxy(this)]);

    this.jam.slices = slices;
    this.config = config;
    this.config.slices = slices;
  }
  getConfig = <T extends Config>() => {
    return this.config as T;
  };
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


export async function createContext(
  system: System,
  user?: User,
  site?: Site,
  role?: Role,
  override = false,
  transaction?: any,
): Promise<Context> {
  const db = await getDatabase<DatabaseContext>(system);
  const { Site, Role, SiteRole } = db.models;

  if (!site) {
    site = await Site.findOne(createOptions({ override: true }, {
      where: {
        default: true
      }
    }));
  }

  if (user?.role) {
    role = user.role;
  } else if (user) {
    role = await user.getRole(createOptions({ override: true }));
  }
  let siteRole: SiteRole | undefined;
  if (!role && site) {
    siteRole = await SiteRole.findOne(
      createOptions({ override: true }, {
        where: {
          siteId: site.id,
          doc: {
            default: true,
          },
        },
        include: [{
          model: Role,
          as: 'role',
          required: true,
        }]
      })
    );
    if (siteRole) {
      role = siteRole.role;
    }
  }
  if (site && role && !siteRole) {
    siteRole = await SiteRole.findOne(
      createOptions({ override: true }, {
        where: {
          siteId: site.id,
          roleId: role.id,
        },
      })
    );
  }
  if (!siteRole && site) {
    siteRole = await SiteRole.findOne(createOptions({ override: true }, {
      where: {
        siteId: site.id,
        doc: {
          default: true,
        }
      }
    }));
  }
  if (!role && override) {
    role = {
      name: 'system',
    } as any;
  }

  const context: Context = {
    system,
    role,
    override,
    transaction,
    user,
    site,
    siteRole,
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
