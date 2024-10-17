import { RelationshipType } from '@vostro/gqlize/lib/types';

import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';
import { Context } from '../../../types/system';
import { createOptions, DataConfig, getDatabase } from '../../data';
import { getSystemFromContext } from '../../../system';

const siteDefinition: IHashDefinition = {
  name: 'Site',
  define: {
    name: { type: DataTypes.STRING, allowNull: false },
    displayName: { type: DataTypes.STRING },
    default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    doc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    docHash: { type: DataTypes.STRING, allowNull: false },
  },
  hashFields: {
    doc: 'docHash',
  },
  relationships: [
    // {
    //   type: RelationshipType.BelongsToMany,
    //   model: 'Role',
    //   name: 'roles',
    //   options: {
    //     through: {
    //       model: 'SiteRole',
    //       foreignKey: 'siteId',
    //       otherKey: 'roleId',
    //     },
    //   },
    // },
    {
      type: RelationshipType.HasMany,
      model: 'SiteRole',
      name: 'siteRoles',
      options: {
        foreignKey: 'siteId',
      },
    },
  ],
  options: {
    tableName: 'sites',
    classMethods: {
      async getSiteByHostname(hostname: string, context: Context) {
        try {
          const system = getSystemFromContext(context);
          const dialect = system.getConfig<DataConfig>().data.sequelize.dialect;
          const db = await getDatabase(system);
          let hostFilter = db.literal(`"doc"->'hostnames' ? ${db.escape(hostname)}`);
          if (dialect === "sqlite") {
            hostFilter = db.literal(`"doc"->'hostnames' LIKE ${db.escape(`%${hostname}%`)}`);
          }
          const { Site } = db.models;
          let site = await Site.findOne(
            createOptions(context, {
              where: hostFilter
            }),
          );
          if (!site) {
            site = await Site.findOne(
              createOptions(context, {
                where: {
                  default: true,
                },
              }),
            );
          }
          return site;
        } catch (e: any) {
          console.error(e);
          throw e;
        }
      },
    }
  },
};
export default siteDefinition;
