import coreModule from '../../modules/core';
import { CoreConfig } from '../../modules/core/types';
import dataModule from '../../modules/data';
import itemsModule from '../../modules/items';

import authLocalModule from '../../modules/auth-local';

import adminRole from './roles/admin';
import authModule from '../../modules/auth';
import eventLogModule from '../../modules/data/event-logs';
import authBearerModule from '../../modules/auth-bearer';
import authJwtModule from '../../modules/auth-jwt';

const config: CoreConfig = {
  name: 'core',
  slices: [
    coreModule,
    dataModule,
    itemsModule,
    authModule,
    eventLogModule,
    authLocalModule,
    authBearerModule,
    authJwtModule
  ],
  roles: {
    admin: adminRole,
  },
  data: {
    reset: true,
    sequelize: {
      // dialect: 'sqlite',
      // storage: './db.sqlite',
      dialect: 'postgres',
      host: 'postgres.local',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'local',
      schema: 'evntlog1',
      logging: false,
    },
  },
  http: {
    port: 3002,
  },
};
export default config;
