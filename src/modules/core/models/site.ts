import { RelationshipType } from '@vostro/gqlize/lib/types';

import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';

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
  },
};
export default siteDefinition;
