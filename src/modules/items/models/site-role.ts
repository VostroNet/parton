import { DataTypes } from 'sequelize';

import { SiteRole } from '../../../types/models/models/site-role';
import { createOptions } from '../../data';
import { IHashDefinition } from '../../utils/field-hash';
import { beforeSiteRoleValidate, updateSiteRoleCache } from '../logic/site-role';

const siteRoleModel: IHashDefinition = {
  define: {
    cacheDoc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    cacheDocHash: { type: DataTypes.STRING, allowNull: false },
  },
  hashFields: {
    cacheDoc: 'cacheDocHash',
  },
  hooks: {
    beforeValidate: [beforeSiteRoleValidate],
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
        this: SiteRole,
        _: any,
        context: any,
      ) {
        await updateSiteRoleCache(this, context);
        return this.save(createOptions(context));
      },
    },
  },
};

export default siteRoleModel;
