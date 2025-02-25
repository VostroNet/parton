import { GraphQLBoolean } from 'graphql';
import DataTypes from '../../../types/data-types';
import { Context } from '../../../types/system';
import { IDefinition } from '../types';
const userDefinition: IDefinition = {
  name: 'User',
  define: {
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  relationships: [
    {
      type: 'belongsTo',
      model: 'Role',
      name: 'role',
      options: {
        foreignKey: 'roleId',
      },
    },
  ],
  options: {
    tableName: "users",
  },
};
export default userDefinition;
