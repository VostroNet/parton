import DataTypes from '../../../types/data-types';
import { IDefinition } from '../types';

const Config: IDefinition = {
  name: 'Config',
  comment: 'Configurations',
  define: {
    type: {
      type: DataTypes.ENUM,
      values: ['generic'],
      allowNull: false,
      defaultValue: 'generic',
      unique: true,
      comment: 'Specify the configuration category',
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      comment: 'configuration',
    },
  },
  options: {
    tableName: 'configs',
  },
};

export default Config;