import { DataTypes } from 'sequelize';

import { Role } from '../../../types/models/models/role';
// import { createOptions } from '../../data';
import { IHashDefinition } from '../../utils/field-hash';
// import { beforeRoleValidate, updateRoleCache } from '../logic/role';

const roleModel: IHashDefinition = {
  define: {
    cacheDoc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    cacheDocHash: { type: DataTypes.STRING, allowNull: false },
  },
  hashFields: {
    cacheDoc: 'cacheDocHash',
  },
  hooks: {
    // beforeValidate: [beforeRoleValidate],
  },
  expose: {
    instanceMethods: {
      query: {
        updateCache: {
          type: 'Role',
        },
      },
    },
  },
  options: {
    instanceMethods: {
      updateCache: async function updateCache(
        this: Role,
        _: any,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _context: any,
      ) {
        // await updateRoleCache(this, context);
        // return this.save(createOptions(context));
      },
    },
  },
};

export default roleModel;
