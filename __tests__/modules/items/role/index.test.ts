// import path from "path";

import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../../src/modules/core';
import { fieldHashModule } from '../../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../../src/modules/utils/role-upsert';
import { CoreConfig } from '../../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../../src/modules/data';
import itemModule from '../../../../src/modules/items';
import { ItemType, RoleItemDoc } from '../../../../src/modules/items/types';
import { createContext, System } from '../../../../src/system';
import { createSiteSetupModule } from '../utils';



const adminRole: RoleItemDoc = {
  default: true,
  "schema": {
    "w": true,
    "d": true,
    "models": {
      "Config": {
        "w": true
      },
      "EventLog": {
        "r": true
      },
      "Role": {
        "w": true
      },
      "User": {
        "w": true
      },
      "UserAuth": {
        "w": true
      }
    }
  },
  "items": {
    "r": false,
    "sets": [{
      "permission": {
        "r": true
      },
      "paths": [
        "/templates/*",
        "/components/**/*",
        "/web/localhost/**/*"
      ]
    }]
  }
};

describe("modules:items:role", () => {
  test("data model relationships", async() => {
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, itemModule, fieldHashModule],
      clone: true,
      roles: {
        admin: adminRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      }
    };

    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch(err: any) {
      expect(err).toBeUndefined();
    }

    const context = await createContext(core, undefined, "system", true);
    const db = await getDatabase(core);
    const {Role, Site} = db.models;
    const initSite = await Site.create({
      name: "Test",
      displayName: "Test",
      default: true,
      doc: {
        data: {
          items: {},
          paths: {},
        }
      },
      docHash: "asd",
    }, createOptions(context));
    expect(initSite).toBeDefined();
    const initRole = await Role.create({
      name: "Test",
      siteId: initSite.id,
      doc: {
        items: {},
      },
      docHash: "asd",
    }, createOptions(context));
    expect(initRole).toBeDefined();
    


    // const initRoleSite = await RoleSite.findOne(createOptions(context));
    // expect(initRoleSite).toBeDefined();

    // const iir = await initRoleSite?.getRole(createOptions(context));
    // expect(iir).toBeDefined();
    // expect(iir).not.toBeNull();

    // const iis = await initRoleSite?.getSite(createOptions(context));
    // expect(iis).toBeDefined();
    // expect(iis).not.toBeNull();

    const isr = await initSite.getRoles(createOptions(context));
    expect(isr).toBeDefined();
    expect(isr).not.toBeNull();
    expect(isr).toHaveLength(1);
    expect(isr[0].id).toEqual(initRole.id);

    const site = await initRole.getSite(createOptions(context));
    expect(site).toBeDefined();
    expect(site).not.toBeNull();
    expect(site.id).toEqual(initSite.id);

    // const q = await db.query(`SELECT * FROM "roles-sites"`, createOptions(context, {
    //   type: QueryTypes.SELECT,
    // }));
    // expect(q).toBeDefined();
    await core.shutdown();
  });
  test("import basic test site - no items - ensure role-site gets created properly", async() => {
   
    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule({
        name: 'test',
        displayName: 'Test',
        default: true,
        items: [],
      })],
      clone: true,
      roles: {
        admin: adminRole,
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      }
    };
    
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch(err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, "system", true);
    const {Role} = db.models;
    const role = await Role.findOne(createOptions(context, {where: {name: 'admin'}}));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const site = await role.getSite(createOptions(context));
    expect(site).toBeDefined();
    expect(site).not.toBeNull();

    expect(role?.cacheDoc).toBeDefined();
    expect(role?.cacheDoc?.data).toBeDefined();
    // expect(role?.cacheDoc?.roleHash).toBeDefined();
    // expect(role?.cacheDoc?.roleHash).toEqual(role?.docHash);
    expect(role?.cacheDoc?.siteHash).toBeDefined();
    expect(role?.cacheDoc?.siteHash).toEqual(site?.docHash);

    
    await core.shutdown();
  });

  test("basic item permissions test", async() => {

    const testRole: RoleItemDoc = {
      default: true,
      "schema": {
        "w": true,
        "d": true,
      },

      "items": {
        "r": false,
        "sets": [{
          "permission": {
            "r": true
          },
          "paths": [
            "/allowed"
          ]
        }]
      }
    };

    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule({
        name: 'test',
        displayName: 'Test',
        default: true,
        items: [{
          name: 'allowed',
          type: ItemType.Folder
        }, {
          name: "denied",
          type: ItemType.Folder
        }],
      })],
      clone: true,
      roles: {
        test: testRole
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      }
    };
    
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch(err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, "system", true);
    const {Site, Role} = db.models;
    const role = await Role.findOne(createOptions(context, {where: {name: 'test'}}));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const site = await Site.findOne(createOptions(context, {where: {default: true}}));
    expect(site).toBeDefined();
    expect(site).not.toBeNull();
    // const rs = await RoleSite.findOne(createOptions(context, {where: {roleId: role?.id}}));
    // expect(rs).toBeDefined();
    // expect(rs).not.toBeNull();

    expect(role?.cacheDoc).toBeDefined();
    expect(role?.cacheDoc?.data).toBeDefined();
    expect(role?.cacheDoc?.data?.paths["/allowed"]).toBeDefined();
    expect(role?.cacheDoc?.data?.paths["/denied"]).toBeUndefined();
    expect(Object.keys(role?.cacheDoc?.data?.items)).toHaveLength(1);
    await core.shutdown();
  });


  test("glob permissions test", async() => {

    const testRole: RoleItemDoc = {
      default: true,
      "schema": {
        "w": true,
        "d": true,
      },

      "items": {
        "r": false,
        "sets": [{
          "permission": {
            "r": true
          },
          "paths": [
            "/allowed/**/*"
          ]
        }]
      }
    };

    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule({
        name: 'test',
        displayName: 'Test',
        default: true,
        items: [{
          name: 'allowed',
          type: ItemType.Folder,
          children: [{
            name: "sub",
            type: ItemType.Folder,
            children: [{
              name: "sub",
              type: ItemType.Folder
            }]
          }]
        }, {
          name: "denied",
          type: ItemType.Folder
        }],
      })],
      clone: true,
      roles: {
        test: testRole
      },
      data: {
        reset: true,
        sync: true,
        sequelize: {
          dialect: 'sqlite',
          storage: ':memory:',
          logging: false,
        },
      }
    };
    
    const core = new System(config);
    try {
      await core.load();
      await core.initialize();
      await core.ready();
    } catch(err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, "system", true);
    const {Role} = db.models;
    const role = await Role.findOne(createOptions(context, {where: {name: 'test'}}));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const site = await role.getSite(createOptions(context));
    expect(site).toBeDefined();
    expect(site).not.toBeNull();


    expect(role?.cacheDoc).toBeDefined();
    expect(role?.cacheDoc?.data).toBeDefined();
    expect(role?.cacheDoc?.data?.paths["/allowed/sub"]).toBeDefined();
    expect(role?.cacheDoc?.data?.paths["/allowed/sub/sub"]).toBeDefined();
    expect(role?.cacheDoc?.data?.paths["/denied"]).toBeUndefined();
    expect(Object.keys(role?.cacheDoc?.data?.items)).toHaveLength(2);
    await core.shutdown();
  });
  // add glob test for permissions
});