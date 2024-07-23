// import { IncomingMessage, Server, ServerResponse } from 'http';

import { describe, expect, test } from '@jest/globals';
import type Express from 'express';

import expressModule, { createContextFromRequest, ExpressConfig, ExpressEvent, ExpressModuleEvents } from '../../src/modules/express';
import httpModule, { HttpEventType, HttpModuleEvents } from '../../src/modules/http';
import { System, SystemContext } from '../../src/system';
import { IModule } from '../../src/types/system';

import "../../__mocks__/http";
import { createBasicConfig } from './items/utils';
// import { CoreConfig } from '../../src/modules/core/types';
// import dataModule from '../../src/modules/data';
// import coreModule from '../../src/modules/core';
// import itemModule from '../../src/modules/items';
// import { fieldHashModule } from '../../src/modules/utils/field-hash';
// import { roleUpsertModule } from '../../src/modules/utils/role-upsert';
// import { databaseConfig } from '../utils/config';

describe('modules:express', () => {
  test('event firing order', async () => {
    const arr: string[] = [];

    const module: IModule & ExpressModuleEvents & HttpModuleEvents = {
      name: 'test1',
      [ExpressEvent.Initialize]: async (express: Express.Application) => {
        arr.push('initialize');
        return express;
      },//_httpServer: Server<typeof IncomingMessage, typeof ServerResponse>, core: System
      [HttpEventType.Ready]: async () => {
        arr.push('ready');
        // return httpServer;
      },
    };
    const config: ExpressConfig = {
      name: 'http-test',
      slices: [httpModule,
        expressModule,
        module,
      ],
      session: {
        secret: "asd",
        resave: false,
        saveUninitialized: true,
      }
    }
    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();
    expect(arr).toHaveLength(2);
    expect(arr[0]).toBe('initialize');
    expect(arr[1]).toBe('ready');
    await core.shutdown();
  });
  test("createContextFromRequest - no user - invalid domain", async () => {
    const config = await createBasicConfig();
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const request: any = {
      hostname: "localhost",
      user: undefined,
    };
    const context = await createContextFromRequest(request, core, false) as SystemContext;
    expect(context).toBeDefined();
    expect(context.site?.name).toBe("test");
    expect(context.user).toBeUndefined();
    expect(context.role?.name).toBe("public");
    expect(context.siteRole).toBeDefined();
    expect(context.override).toBeFalsy();
    expect(context.system).toBeDefined();
    expect(context.system).toBe(core);
    expect(context.transaction).toBeUndefined();
    await core.shutdown();
  });

  test("createContextFromRequest - no user - non default site", async () => {
    const config = await createBasicConfig();
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const request: any = {
      hostname: "admin-only.com",
      user: undefined,
    };
    const context = await createContextFromRequest(request, core, false) as SystemContext;
    expect(context).toBeDefined();
    expect(context.site?.name).toBe("admin-only");
    expect(context.user).toBeUndefined();
    expect(context.role?.name).toBe("admin");
    expect(context.siteRole).toBeDefined();
    expect(context.override).toBeFalsy();
    expect(context.system).toBeDefined();
    expect(context.system).toBe(core);
    expect(context.transaction).toBeUndefined();
    await core.shutdown();
  });
});
