// import { IncomingMessage, Server, ServerResponse } from 'http';

import { describe, expect, test } from '@jest/globals';
import type Express from 'express';

import expressModule, { ExpressConfig, ExpressEvent, ExpressModuleEvents } from '../../src/modules/express';
import httpModule, { HttpEventType, HttpModuleEvents } from '../../src/modules/http';
import { System } from '../../src/system';
import { IModule } from '../../src/types/system';

import "../../__mocks__/http";

describe('modules:http', () => {
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
});
