import coreModule from '../../modules/core';
import { CoreConfig } from '../../modules/core/types';
import dataModule from // createOptions,
// DataEvent,
// DataEvents,
// getDatabase,
'../../modules/data';
import expressModule from '../../modules/express';
import gqljdtModule from '../../modules/gqljdt';
import httpModule from '../../modules/http';
import { fieldHashModule } from '../../modules/utils/field-hash';
import { roleUpsertModule } from '../../modules/utils/role-upsert';
import yogaModule from '../../modules/yoga';
// import { System } from '../../system';
// import { IModule } from '../../types/system';
// import waterfall from '../../utils/waterfall';

import adminRole from './roles/admin';
import publicRole from './roles/public';

// const mod: DataEvents & IModule = {
//   name: 'Application',
//   [DataEvent.Setup]: async (_gqlManager: any, system: System) => {
//     const cfg = system.getConfig<CoreConfig>();
//     const context = {override: true};
//     await waterfall(Object.keys(cfg.roles), async (roleName: string) => {
//       const roleSchema = cfg.roles[roleName];

//       const db = await getDatabase(system);
//       const { Role } = db.models;

//       const role = await Role.findOne(createOptions(context, {
//         where: {
//           name: roleName,
//         },
//       }));
//       if (!role) {
//         system.logger.debug('Creating role', roleName);
//         await Role.create(
//           {
//             name: roleName,
//             doc: roleSchema,
//             default: roleSchema.default,
//           },
//           createOptions(context),
//         );
//       } else {
//         system.logger.debug('Updating role', roleName);
//         await role.update(
//           {
//             doc: roleSchema,
//             default: roleSchema.default,
//           },
//           createOptions(context),
//         );
//       }
//     });
//   },
// };

const config: CoreConfig = {
  devMode: false,
  name: 'core-test-app',
  slices: [
    coreModule,
    dataModule,
    httpModule,
    expressModule,
    gqljdtModule,
    yogaModule,
    roleUpsertModule,
    fieldHashModule,
  ],
  roles: {
    admin: adminRole,
    public: publicRole,
  },
  data: {
    reset: true,
    sync: true,
    sequelize: {
      dialect: 'sqlite',
      // storage: ':memory:',
      storage: './db.sqlite',
      logging: false,
    },
  },
  http: {
    port: 3001,
  },
  session: {
    secret: '1234test',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  },
};
export default config;
