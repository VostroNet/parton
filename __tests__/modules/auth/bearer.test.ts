// import { IncomingMessage, Server, ServerResponse } from 'http';

import { describe, expect, jest, test } from '@jest/globals';
import type Express from 'express';
import { mockRequest, mockResponse } from 'jest-mock-req-res';

import bearerAuthModule from '../../../src/modules/auth/bearer';
import coreModule from '../../../src/modules/core';
import { CoreConfig, RoleDoc } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import expressModule, { ExpressEvent, ExpressModuleEvents } from '../../../src/modules/express';
import httpModule, { HttpEventType, HttpModuleEvents } from '../../../src/modules/http';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';
import { IModule } from '../../../src/types/system';

import "../../../__mocks__/http";


describe('modules:auth:bearer', () => {
  test('basic auth', async () => {
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
    const defTestRole: RoleDoc = {
      default: true,
      schema: {
        w: true,
        d: true,
      },
    };
    const config: CoreConfig = {
      name: 'express-bearer-test',
      slices: [
        httpModule, 
        expressModule,
        dataModule,
        coreModule,
        bearerAuthModule,
        fieldHashModule,
        roleUpsertModule,
        module,
      ],
      session: {
        secret: "asd",
        resave: false,
        saveUninitialized: true,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      },
      roles: {
        test: defTestRole,
      }
    }
    
    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();

    const context = await createContext(core, undefined, undefined, true);

    const db = await getDatabase(core);
    const {User, UserAuth, Role} = db.models;
    const testRole = await Role.findOne(createOptions(context, {where: {name: 'test'}}));
    expect(testRole).toBeDefined();
    const user = await User.create({
      userName: 'test',
      email: 'asd@asd.com',
      roleId: testRole?.id
    }, createOptions(context));

    const authCred = await UserAuth.create({
      userId: user.id,
      type: 'bearer',
      token: 'test'
    }, createOptions(context));
    expect(authCred).toBeDefined();
    expect(authCred.token).not.toBe("test");

    const req = mockRequest({
      method: 'GET',
      url: `/user`,
      headers: {
        'authorization': 'Bearer test'
      },
    });
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      },

      send: function() {
        this.end();
      }
    });
    try {
      await core.execute(HttpEventType.Request, req, res, core);
    } catch (err: any) {
      console.error(err.stack)
      expect(err).toBeUndefined();
    }

    expect(req.user).toBeDefined();
    expect((req.user as any)?.id).toBe(user.id);
    await core.shutdown();
  });
});
