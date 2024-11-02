import DataTypes from '../../../types/data-types';
import { IHashDefinition } from '../../utils/field-hash';

const siteDefinition: IHashDefinition = {
  name: 'SiteRole',
  hashFields: {
    doc: 'docHash',
  },
  define: {
    default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    doc: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    docHash: { type: DataTypes.STRING, allowNull: false },
  },
  relationships: [{
    type: 'belongsTo',
    model: 'Site',
    name: 'site',
    options: {
      foreignKey: 'siteId',
    },
  }, {
    type: 'belongsTo',
    model: 'Role',
    name: 'role',
    options: {
      foreignKey: 'roleId',
    },
  }],
  options: {
    tableName: 'sites-roles',
  },
};
export default siteDefinition;
