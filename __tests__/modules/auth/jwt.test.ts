// import { IncomingMessage, Server, ServerResponse } from 'http';

import { describe, expect, jest, test } from '@jest/globals';
import type Express from 'express';
import { toGlobalId } from 'graphql-relay';
import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import fetch from 'node-fetch'

import jwtAuthModule, { JwtConfig } from "../../../src/modules/auth-jwt";
import coreModule from '../../../src/modules/core';
import authModule from "../../../src/modules/auth";
import { CoreConfig, RoleDoc } from '../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../src/modules/data';
import expressModule, { ExpressEvent, ExpressModuleEvents } from '../../../src/modules/express';
import httpModule, { HttpEventType, HttpModuleEvents } from '../../../src/modules/http';
import { fieldHashModule } from '../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../src/system';
import { IModule } from '../../../src/types/system';

import "../../../__mocks__/http";
import { createTestSite } from '../items/utils';
import DatabaseContext from '../../../src/types/models';

jest.mock('node-fetch', () => jest.fn())



describe('modules:auth:jwks', () => {
  test('bearer auth', async () => {
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
    // const defTestRole: RoleDoc = {
    //   default: true,
    //   schema: {
    //     w: true,
    //     d: true,
    //   },
    // };
    const { publicKey, privateKey } = await generateKeyPair("ES256", {

    });
    const { roles, siteModule } = await createTestSite();
    const config: CoreConfig & JwtConfig = {
      name: 'express-bearer-test',
      slices: [
        httpModule,
        expressModule,
        dataModule,
        coreModule,
        // bearerAuthModule,
        jwtAuthModule,
        fieldHashModule,
        roleUpsertModule,
        module,
        siteModule,
      ],
      clone: true,
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
      roles: roles,
      auth: {
        jwt: {
          privateKey,
          publicKey
        }
      }
    }

    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();

    const context = await createContext(core, undefined, undefined, undefined, true);

    const db = await getDatabase<DatabaseContext>(core);
    const { User, Role } = db.models;
    const testRole = await Role.findOne(createOptions(context, { where: { name: 'public' } }));
    expect(testRole).toBeDefined();
    const user = await User.create({
      userName: 'test',
      email: 'asd@asd.com',
      roleId: testRole?.id
    }, createOptions(context));

    const jwtToken = await user.jwtToken({}, context);

    // const authCred = await UserAuth.create({
    //   userId: user.id,
    //   type: 'bearer',
    //   token: 'test'
    // }, createOptions(context));
    // expect(authCred).toBeDefined();
    // expect(authCred.token).not.toBe("test");

    const req = mockRequest({
      method: 'GET',
      url: `http://localhost/user`,
      headers: {
        'authorization': `Bearer ${jwtToken}`
      },
    });
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      },

      send: function () {
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
  test('url auth', async () => {
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

    const { roles, siteModule } = await createTestSite();
    const { publicKey, privateKey } = await generateKeyPair("ES256", {

    });
    const config: CoreConfig & JwtConfig = {
      name: 'express-bearer-test',
      slices: [
        httpModule,
        expressModule,
        dataModule,
        coreModule,
        authModule,
        jwtAuthModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
        module,
      ],
      clone: true,
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
      roles,
      auth: {
        jwt: {
          privateKey,
          publicKey
        }
      }
    }

    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();

    const context = await createContext(core, undefined, undefined, undefined, true);

    const db = await getDatabase<DatabaseContext>(core);
    const { User, Role } = db.models;
    const testRole = await Role.findOne(createOptions(context, { where: { name: 'public' } }));
    expect(testRole).toBeDefined();
    const user = await User.create({
      userName: 'test',
      email: 'asd@asd.com',
      roleId: testRole?.id
    }, createOptions(context));

    const jwtToken = await user.jwtToken({}, context);

    // const authCred = await UserAuth.create({
    //   userId: user.id,
    //   type: 'bearer',
    //   token: 'test'
    // }, createOptions(context));
    // expect(authCred).toBeDefined();
    // expect(authCred.token).not.toBe("test");

    const req = mockRequest({
      method: 'GET',
      url: `https://localhost/user`,
      query: {
        jwt: jwtToken
      }
    });
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      },

      send: function () {
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

  test('jwks well-known', async () => {
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

    const { roles, siteModule } = await createTestSite();
    // const defTestRole: RoleDoc = {
    //   default: true,
    //   schema: {
    //     w: true,
    //     d: true,
    //   },
    // };
    const { publicKey, privateKey } = await generateKeyPair("ES256", {
      // 
    });
    const config: CoreConfig & JwtConfig = {
      name: 'express-bearer-test',
      slices: [
        httpModule,
        expressModule,
        dataModule,
        coreModule,
        authModule,
        // bearerAuthModule,
        jwtAuthModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
        module,
      ],
      clone: true,
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
      roles,
      auth: {
        jwt: {
          privateKey,
          publicKey
        }
      }
    }

    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();

    const req = mockRequest({
      method: 'GET',
      url: `/.well-known/jwks.json`,
    });
    let out = "";
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      },

      send: function () {
        this.end();
      },
      json: function (obj: any) {
        out = JSON.stringify(obj);
        this.end();
      }
    });
    try {
      await core.execute(HttpEventType.Request, req, res, core);
    } catch (err: any) {
      console.error(err.stack)
      expect(err).toBeUndefined();
    }
    expect(out).toBe(JSON.stringify({
      keys: [
        await exportJWK(publicKey)
      ]
    }));

    await core.shutdown();
  });
  test('external jwks auth', async () => {
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

    const { roles, siteModule } = await createTestSite();
    const { publicKey, privateKey } = await generateKeyPair("ES256", {

    });
    const config: CoreConfig & JwtConfig = {
      name: 'express-bearer-test',
      slices: [
        httpModule,
        expressModule,
        dataModule,
        coreModule,
        authModule,
        jwtAuthModule,
        fieldHashModule,
        roleUpsertModule,
        siteModule,
        module,
      ],
      clone: true,
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
      roles,
      auth: {
        jwks: {
          url: "http://localhost/.well-known/jwks.json",
          autoCreateUser: true,
        }
      }
    }

    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();

    // const context = await createContext(core, undefined, undefined, true);

    // const db = await getDatabase<DatabaseContext>(core);
    // const {User, Role} = db.models;
    // const testRole = await Role.findOne(createOptions(context, {where: {name: 'test'}}));
    // expect(testRole).toBeDefined();
    // const user = await User.create({
    //   userName: 'test',
    //   email: 'asd@asd.com',
    //   roleId: testRole?.id
    // }, createOptions(context));

    // const jwtToken = await user.jwtToken({}, context);

    // const authCred = await UserAuth.create({
    //   userId: user.id,
    //   type: 'bearer',
    //   token: 'test'
    // }, createOptions(context));
    // expect(authCred).toBeDefined();
    // expect(authCred.token).not.toBe("test");
    const exportedKey = await exportJWK(publicKey);
    const response = Promise.resolve({
      ok: true,
      status: 200,
      json: () => {
        // return returnBody ? returnBody : {};
        return {
          keys: [exportedKey]
        }
      },
    });
    const jwt = await new SignJWT({
      "userId": toGlobalId("User", "1337"),
      "source": "Hello",
      "userName": "userName",
      "email": "email",
      "role": "admin",
    })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuedAt()
      .sign(privateKey);
    (fetch as any).mockImplementation(() => response)

    const req = mockRequest({
      method: 'GET',
      url: `https://localhost/user`,
      query: {
        jwt: jwt
      }
    });
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      },

      send: function () {
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
    // expect((req.user as any)?.id).toBe(user.id);
    await core.shutdown();
  }, 100000);
});

