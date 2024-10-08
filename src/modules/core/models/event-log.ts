import DataTypes from '../../../types/data-types';
import { IDefinition } from '../types';


const EventLog: IDefinition = {
  name: 'EventLog',
  define: {
    action: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    changeset: { type: DataTypes.JSONB },
    source: { type: DataTypes.STRING },
    model: { type: DataTypes.STRING, allowNull: true },
    primaryKey: { type: DataTypes.INTEGER, allowNull: true },
  },
  relationships: [
    {
      type: 'belongsTo',
      model: 'User',
      name: 'user',
      options: { foreignKey: 'userId' },
    },
  ],
};

export default EventLog;