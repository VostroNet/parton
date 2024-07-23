// import path from "path";

import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../../src/modules/core';
import { CoreConfig, RoleDoc } from '../../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../../src/modules/data';
import itemModule from '../../../../src/modules/items';
import { ItemType, SiteRoleDoc } from '../../../../src/modules/items/types';
import { fieldHashModule } from '../../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../../src/system';
// import { Role } from '../../../../src/types/models/models/role';
// import { Site } from '../../../../src/types/models/models/site';
// import { SiteRole } from '../../../../src/types/models/models/site-role';
import { createSiteSetupModule } from '../utils';



const adminRole: RoleDoc = {
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
}
const adminDefaultItemPermissions: SiteRoleDoc = {
  default: true,
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
  // test("data model relationships", async() => {
  //   const config: CoreConfig = {
  //     name: 'data-test',
  //     slices: [dataModule, coreModule, itemModule, fieldHashModule],
  //     clone: true,
  //     sites: {
  //       default: {
  //         hostnames: ['localhost'],
  //         default: true,
  //         roles: {
  //           admin: adminDefaultItemPermissions,
  //         },
  //       },
  //     },
  //     roles: {
  //       admin: adminRole,
  //     },
  //     data: {
  //       reset: true,
  //       sync: true,
  //       sequelize: {
  //         dialect: 'sqlite',
  //         storage: ':memory:',
  //         logging: false,
  //       },
  //     }
  //   };

  //   const core = new System(config);
  //   try {
  //     await core.load();
  //     await core.initialize();
  //     await core.ready();
  //   } catch(err: any) {
  //     expect(err).toBeUndefined();
  //   }

  //   const context = await createContext(core, undefined, undefined, true);
  //   const db = await getDatabase(core);
  //   const {Role, Site, SiteRole} = db.models;
  //   const initSite: Site = await Site.create({
  //     name: "Test",
  //     displayName: "Test",
  //     default: true,
  //     doc: {
  //       data: {
  //         items: {},
  //         paths: {},
  //       }
  //     },
  //     docHash: "asd",
  //   }, createOptions(context));
  //   expect(initSite).toBeDefined();
  //   const initRole: Role = await Role.create({
  //     name: "Test",
  //     doc: {
  //       schema: {},
  //     },
  //     docHash: "asd",
  //   }, createOptions(context));
  //   expect(initRole).toBeDefined();

  //   const initRoleSite: SiteRole = await SiteRole.create({
  //     roleId: initRole.id,
  //     siteId: initSite.id,
  //     doc: {
  //       items: {},
  //     },
  //     docHash: "asd",
  //   }, createOptions(context));

  //   // const initRoleSite = await RoleSite.findOne(createOptions(context));
  //   // expect(initRoleSite).toBeDefined();

  //   // const iir = await initRoleSite?.getRole(createOptions(context));
  //   // expect(iir).toBeDefined();
  //   // expect(iir).not.toBeNull();

  //   // const iis = await initRoleSite?.getSite(createOptions(context));
  //   // expect(iis).toBeDefined();
  //   // expect(iis).not.toBeNull();

  //   const isr = await initSite.getSiteRoles(createOptions(context));
  //   expect(isr).toBeDefined();
  //   expect(isr).not.toBeNull();
  //   expect(isr).toHaveLength(1);
  //   expect(isr[0].id).toEqual(initRole.id);

  //   const site = await initRole.getSite(createOptions(context));
  //   expect(site).toBeDefined();
  //   expect(site).not.toBeNull();
  //   expect(site.id).toEqual(initSite.id);

  //   // const q = await db.query(`SELECT * FROM "roles-sites"`, createOptions(context, {
  //   //   type: QueryTypes.SELECT,
  //   // }));
  //   // expect(q).toBeDefined();
  //   await core.shutdown();
  // });
  test("import basic test site - no items - ensure role-site gets created properly", async () => {

    const config: CoreConfig = {
      name: 'data-test',
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule([{
        name: 'test',
        displayName: 'Test',
        default: true,
        sitePath: "",
        hostnames: ['localhost'],
        roles: {
          admin: adminDefaultItemPermissions
        },
        items: [],
      }])],
      clone: true,
      // sites: {
      //   default: {
      //     hostnames: ['localhost'],
      //     default: true,
      //     roles: {
      //       admin: adminDefaultItemPermissions,
      //     },
      //   },
      // },
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
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role } = db.models;
    const role = await Role.findOne(createOptions(context, { where: { name: 'admin' } }));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const siteRoles = await role.getSiteRoles(createOptions(context, {}));
    expect(siteRoles).toBeDefined();
    expect(siteRoles).toHaveLength(1);
    const siteRole = siteRoles[0];
    expect(siteRole?.cacheDoc).toBeDefined();
    expect(siteRole?.cacheDoc?.data).toBeDefined();
    // expect(role?.cacheDoc?.roleHash).toBeDefined();
    // expect(role?.cacheDoc?.roleHash).toEqual(role?.docHash);
    expect(siteRole?.cacheDoc?.siteHash).toBeDefined();
    const site = await siteRole.getSite(createOptions(context));
    expect(siteRole?.cacheDoc?.siteHash).toEqual(site?.docHash);


    await core.shutdown();
  });

  test("basic item permissions test", async () => {

    const testRole: RoleDoc = {
      "schema": {
        "w": true,
        "d": true,
      },
    }
    const siteRole: SiteRoleDoc = {
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
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule,
        createSiteSetupModule([{
          name: 'test',
          displayName: 'Test',
          default: true,
          sitePath: "/",
          roles: {
            test: siteRole,
          },
          items: [{
            name: 'allowed',
            type: ItemType.Folder
          }, {
            name: "denied",
            type: ItemType.Folder
          }],
        }])],
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
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Site, Role } = db.models;
    const role = await Role.findOne(createOptions(context, { where: { name: 'test' } }));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const site = await Site.findOne(createOptions(context, { where: { default: true } }));
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


  test("glob permissions test", async () => {

    const testRoleDoc: RoleDoc = {
      "schema": {
        "w": true,
        "d": true,
      },
    };
    const testSiteRoleDoc: SiteRoleDoc = {
      default: true,
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
      slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule([{
        name: 'test',
        displayName: 'Test',
        default: true,
        sitePath: "/allowed",
        roles: {
          test: testSiteRoleDoc,
        },
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
      }])],
      clone: true,
      roles: {
        test: testRoleDoc
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
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    const db = await getDatabase(core);

    const context = await createContext(core, undefined, undefined, undefined, true);
    const { Role, Site } = db.models;
    const role = await Role.findOne(createOptions(context, { where: { name: 'test' } }));
    expect(role).toBeDefined();
    expect(role).not.toBeNull();
    const siteRoles = await role.getSiteRoles(createOptions(context, {
      include: [{
        model: Site,
        as: 'site',
        required: true,
      }]
    }));
    expect(siteRoles).toBeDefined();
    expect(siteRoles).toHaveLength(1);
    const siteRole = siteRoles[0];


    expect(siteRole?.cacheDoc).toBeDefined();
    expect(siteRole?.cacheDoc?.data).toBeDefined();
    expect(siteRole?.cacheDoc?.data?.paths["/allowed/sub"]).toBeDefined();
    expect(siteRole?.cacheDoc?.data?.paths["/allowed/sub/sub"]).toBeDefined();
    expect(siteRole?.cacheDoc?.data?.paths["/denied"]).toBeUndefined();
    expect(Object.keys(siteRole?.cacheDoc?.data?.items)).toHaveLength(2);
    await core.shutdown();
  });
  // add glob test for permissions
});