import { DataTypes } from 'sequelize';

import { ItemEvent } from '..';
import { SiteRole } from '../../../types/models/models/site-role';
import { createOptions, getSystemFromContext } from '../../data';
import { IHashDefinition } from '../../utils/field-hash';
import { beforeRoleValidate } from '../logic/role';
import { SiteRoleDoc, SiteDoc, SiteRoleCacheDoc } from '../types';
import { createRoleItemsCache } from '../utils';

const siteRoleModel: IHashDefinition = {
  define: {
    cacheDoc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    cacheDocHash: { type: DataTypes.STRING, allowNull: false },
  },
  hashFields: {
    cacheDoc: 'cacheDocHash',
  },
  hooks: {
    beforeValidate: [beforeRoleValidate],
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
        const site = await this.getSite(createOptions(context));
        // await updateRoleCache(this, site, context);
        const siteRoleDoc: SiteRoleDoc = this.doc;
        if (!siteRoleDoc?.items) {
          throw new Error('Invalid item permissions');
        }
        const siteDoc: SiteDoc = site.doc;
        if (!siteDoc?.data) {
          throw new Error('Invalid site item data');
        }
        const newItemStore = await createRoleItemsCache(siteDoc, siteRoleDoc, context);

        const cacheDoc: SiteRoleCacheDoc = {
          ...this.cacheDoc,
          // roleHash: role.docHash,
          siteHash: site.docHash,
          data: newItemStore,
        };
        const core = getSystemFromContext(context);
        this.set("cacheDoc", await core.execute(
          ItemEvent.ProcessSiteRoleCacheDoc,
          cacheDoc,
          this,
          site,
          context,
        ));

        return this.save(createOptions(context));
      },
    },
  },
};

export default siteRoleModel;
