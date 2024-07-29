// import path from "path";

import { describe, expect, test } from '@jest/globals';

import coreModule from '../../../../src/modules/core';
import { CoreConfig } from '../../../../src/modules/core/types';
import dataModule, { createOptions, getDatabase } from '../../../../src/modules/data';
import itemModule from '../../../../src/modules/items';
import { fieldHashModule } from '../../../../src/modules/utils/field-hash';
import { roleUpsertModule } from '../../../../src/modules/utils/role-upsert';
import { createContext, System } from '../../../../src/system';
import { createBasicConfig } from '../utils';
// import { SystemEvent } from '../../../src/types/events';

// import { ItemData } from '../../../src/modules/items/types';
// import {createItemDataFromFile, createItemDataFromImportItems} from '../../../src/modules/items/utils';

// const adminRole: RoleItemDoc = {
//   default: true,
//   "schema": {
//     "w": true,
//     "d": true,
//     "models": {
//       "Config": {
//         "w": true
//       },
//       "EventLog": {
//         "r": true
//       },
//       "Role": {
//         "w": true
//       },
//       "User": {
//         "w": true
//       },
//       "UserAuth": {
//         "w": true
//       }
//     }
//   },
//   "items": {
//     "r": false,
//     "sets": [{
//       "permission": {
//         "r": true
//       },
//       "paths": [
//         "/templates/*",
//         "/components/**/*",
//         "/web/localhost/**/*"
//       ]
//     }]
//   }
// };

describe("modules:core:site", () => {
  test("site - doc check basic structure", async () => {
    const config = await createBasicConfig();
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
    const { Site } = db.models;
    const s = await Site.findOne(createOptions(context, { where: { name: 'test' } }));
    expect(s).toBeDefined();
    expect(s?.displayName).toBe('test');
    expect(s?.doc).toBeDefined();
    expect(s?.doc.data.items).toBeDefined();
    // expect(s?.doc.data.items).toEqual({});
    expect(s?.doc.data.paths).toBeDefined();
    // expect(s?.doc.data.paths).toEqual({});
    expect(s?.doc.hostnames).toBeDefined();
    expect(s?.doc.hostnames).toHaveLength(1);
    expect(s?.doc.hostnames[0]).toBe('test.com');
    expect(s?.docHash).toBeDefined();
    expect(s?.docHash).not.toBe('');
    expect(s?.docHash).not.toBe(null);
    await core.shutdown();
  });

  // test("system - import basic test site - with items", async () => {
  //   const config: CoreConfig = {
  //     name: 'data-test',
  //     slices: [dataModule, coreModule, itemModule, fieldHashModule, roleUpsertModule, createSiteSetupModule({
  //       name: 'test',
  //       displayName: 'Test',
  //       default: true,
  //       sitePath: "/",
  //       items: [{
  //         name: 'test',
  //         type: 'folder',
  //         children: [
  //           {
  //             name: 'test1',
  //             type: 'folder',
  //             children: [{
  //               name: 'test2',
  //               type: 'folder',
  //               children: []
  //             }]
  //           }
  //         ]

  //       }],
  //     })],
  //     clone: true,
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
  //   } catch (err: any) {
  //     expect(err).toBeUndefined();
  //   }
  //   const db = await getDatabase(core);

  //   const context = await createContext(core, undefined, undefined, true);
  //   const { Site } = db.models;
  //   const s = await Site.findOne(createOptions(context, { where: { name: 'test' } }));
  //   expect(s).toBeDefined();
  //   expect(s?.displayName).toBe('Test');
  //   expect(s?.doc).toBeDefined();
  //   expect(s?.doc.data.items).toBeDefined();
  //   expect(Object.keys(s?.doc.data.items)).toHaveLength(3);
  //   expect(s?.doc.data.paths).toBeDefined();
  //   expect(s?.doc.data.paths["/test"]).toBeDefined();
  //   expect(s?.doc.data.paths["/test/test1"]).toBeDefined();
  //   expect(s?.doc.data.paths["/test/test1/test2"]).toBeDefined();
  //   expect(s?.docHash).toBeDefined();
  //   expect(s?.docHash).not.toBe('');
  //   expect(s?.docHash).not.toBe(null);
  //   await core.shutdown();
  // });
});