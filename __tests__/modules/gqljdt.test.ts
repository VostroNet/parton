import { describe, expect, jest, test } from '@jest/globals';
import { mockRequest, mockResponse } from 'jest-mock-req-res';

import coreModule from '../../src/modules/core';
import { CoreConfig } from '../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../src/modules/data';
import expressModule from '../../src/modules/express';
import gqljdtModule, { IGqlJdtModule } from '../../src/modules/gqljdt';
import httpModule, { HttpEventType } from '../../src/modules/http';
import itemModule from '../../src/modules/items';
import { RoleItemDoc } from '../../src/modules/items/types';
import { fieldHashModule } from '../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../src/modules/utils/role-upsert';
import { System } from '../../src/system';
import "../../__mocks__/http";
import { createHexString } from '../../src/utils/string';


describe("modules:services:gqljdt", () => {
  test("schema creation test", async() => {
    const testRole: RoleItemDoc = {
      default: true,
      schema: {
        w: true,
        d: true,
      },
      items: {
        r: true,
        sets: [],
      },
    };
    // const schemas: {
    //   [key: string]: GraphQLSchema
    // } = {};
    // const schemaCollector: IDependencies & CoreModuleEvents = {
    //   [CoreModuleEvent.GraphQLSchemaCreate]: async (schema: GraphQLSchema, role: Role) => {
    //     schemas[role.name] = schema;
    //   }
    // }

    const config: CoreConfig = {
      name: 'gqljdt-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        gqljdtModule,
        httpModule,
        expressModule,
      ],
      clone: true,
      roles: {
        test: testRole,
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
      session: {
        secret: "Hello",
        resave: false,
        saveUninitialized: false,
      }
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);
    expect(db).toBeDefined();
    const {Role} = db.models;
    const role = await Role.findOne(createOptions({override: true}, {where: {name: "test"}}));
    const gqlJdtSlice = core.get<IGqlJdtModule>("gqljdt");
    expect(gqlJdtSlice).toBeDefined();
    expect(gqlJdtSlice.jdtCache).toBeDefined();
    const hexId = createHexString(role?.id);
    expect(gqlJdtSlice.jdtCache[hexId]).toBeDefined();
    expect(gqlJdtSlice.jdtCache[hexId].p?.Query?.p?.getPage).toBeDefined();
    await core.shutdown();
  });

  test("express endpoint - /gqljdt.api/:id", async() => {
    const testRole: RoleItemDoc = {
      default: true,
      schema: {
        w: true,
        d: true,
      },
      items: {
        r: true,
        sets: [],
      },
    };
    const config: CoreConfig = {
      name: 'gqljdt-test',
      slices: [
        dataModule,
        coreModule,
        itemModule,
        fieldHashModule,
        roleUpsertModule,
        gqljdtModule,
        httpModule,
        expressModule,
      ],
      clone: true,
      roles: {
        test: testRole,
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
      session: {
        secret: "Hello",
        resave: false,
        saveUninitialized: false,
      }
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);
    expect(db).toBeDefined();
    const {Role, User} = db.models;
    const role = await Role.findOne(createOptions({override: true}, {where: {name: "test"}}));
    const user = await User.create({
      firstName: "test",
      lastName: "test",
      email: "asd@asd.com",
      disabled: false,
      userName: "test",
      roleId: role?.id,
    }, createOptions({override: true}));
    expect(user).toBeDefined();

    const gqlJdtSlice = core.get<IGqlJdtModule>("gqljdt");
    expect(gqlJdtSlice).toBeDefined();
    expect(gqlJdtSlice.jdtCache).toBeDefined();
    const hexId = createHexString(role?.id);
    expect(gqlJdtSlice.jdtCache[hexId]).toBeDefined();

    const req = mockRequest({
      method: 'GET',
      url: `/gqljdt.api/${hexId}`,
      user,
    });
    const res = mockResponse({
      setHeader: jest.fn(),
      getHeader: () => {
        return undefined;
      }
    });
    const json = res.json;
    res.json = (...args: any[]) => {
      json.apply(res, args);
      // ensures end of stream is called, so the promise can resolve
      return res.end();
    }
    try {
      await core.execute(HttpEventType.Request, req, res, core);
    } catch (err: any) {
      console.error(err.stack)
      expect(err).toBeUndefined();
    }

    json.mock.calls.forEach((call: any[]) => {
      expect(call).toBeDefined();
      expect(call.length).toBe(1);
      expect(call[0]).toBeDefined();
      expect(call[0].p?.Query?.p?.getPage).toBeDefined();
    })
    try {
      await core.shutdown();
    } catch (err: any) { 
      console.error(err.stack)
      expect(err).toBeUndefined();
    }
  });
  //TODO: test redirect
  //TODO: test redirect with invalid role id
});