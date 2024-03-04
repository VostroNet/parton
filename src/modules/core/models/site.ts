import { RelationshipType } from '@vostro/gqlize/lib/types';

import DataTypes from '../../../types/data-types';
import { IDefinition } from '../types';

const siteDefinition: IDefinition = {
  name: 'Site',
  define: {
    name: { type: DataTypes.STRING, allowNull: false },
    displayName: { type: DataTypes.STRING },
    default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  relationships: [
    {
      type: RelationshipType.HasMany,
      model: 'Role',
      name: 'roles',
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
