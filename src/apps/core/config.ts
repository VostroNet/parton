import coreModule from '../../modules/core';
import { CoreConfig } from '../../modules/core/types';
import dataModule from '../../modules/data';
import itemsModule from '../../modules/items';

import authLocalModule from '../../modules/auth-local';

import adminRole from './roles/admin';

const config: CoreConfig = {
  name: 'core',
  slices: [coreModule, dataModule, itemsModule, authLocalModule],
  roles: {
    admin: adminRole,
  },
  data: {
    reset: true,
    sequelize: {
      dialect: 'sqlite',
      storage: './db.sqlite',
    },
  },
  http: {
    port: 3002,
  },
};
export default config;
