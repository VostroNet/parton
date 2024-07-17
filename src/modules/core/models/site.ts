import { RelationshipType } from '@vostro/gqlize/lib/types';

import DataTypes from '../../../types/data-types';
import { IDefinition } from '../types';

const siteDefinition: IDefinition = {
  name: 'Site',
  define: {
    name: { type: DataTypes.STRING, allowNull: false },
    displayName: { type: DataTypes.STRING },
    default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    hostnames: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
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
  },
};
export default siteDefinition;
