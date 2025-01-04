import { GraphQLBoolean } from 'graphql';
import { Context } from '../../../types/system';
import { IDefinition } from '../../data/types';
const userDefinition: IDefinition = {
  relationships: [
    {
      type: 'hasMany',
      model: 'UserAuth',
      name: 'auths',
      options: {
        as: 'auths',
        foreignKey: 'userId',
      },
    },
  ],
  expose: {
    classMethods: {
      query: {
        isLoggedIn: {
          type: GraphQLBoolean,
          args: {},
        }
      }
    }
  },
  options: {
    tableName: "users",
    classMethods: {
      isLoggedIn(args: never, context: Context) {
        return !!context.user;
      },
    },
  },
};
export default userDefinition;
