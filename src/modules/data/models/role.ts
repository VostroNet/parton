import { RelationshipType } from '@azerothian/gqlize/lib/types';

import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';

const roleModel: IHashDefinition = {
  name: 'Role',
  comment: 'This is a role table.',
  comments: {
    fields: {
      name: 'This is the name of the role.',
      user: 'role hasMany user',
    },
  },
  hashFields: {
    doc: 'docHash',
  },
  define: {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'This is the name of the role.',
    },
    // default: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: false,
    //   comment: 'This is the default role.',
    // },
    docHash: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'This is the hash of the role.',
    },
    doc: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'This is the enabled role.',
    } as any,
  },
  override: {},
  relationships: [
    {
      type: RelationshipType.HasMany,
      model: 'User',
      name: 'users',
      options: {
        foreignKey: 'roleId',
      },
    },
    // {
    //   type: RelationshipType.BelongsToMany,
    //   model: 'Site',
    //   name: 'site',
    //   options: {
    //     through: {
    //       model: 'SiteRole',
    //       foreignKey: 'roleId',
    //       otherKey: 'siteId',
    //     }
    //   },
    // },
    {
      type: RelationshipType.HasMany,
      model: 'SiteRole',
      name: 'siteRoles',
      options: {
        foreignKey: 'roleId',
      },
    }
  ],
  options: {
    tableName: 'roles',
  },
};
export default roleModel;
