// import bcrypt from 'bcrypt';

import { Sequelize } from 'sequelize';
import DataTypes from '../../../types/data-types';
// import { getContextFromOptions } from '../../data';
// import { validateFindOptions, validateMutation } from '../../data/validation';
// import { MutationType } from '../../core/types';
import { FindOptions, IDefinition } from '../../data/types';
import { validateFindOptions, validateMutation } from '../../data/validation';
import { MutationType } from '../../core/types';

const authLogModel: IDefinition = {
  name: 'AuthLog',
  disableEventLog: true,
  define: {
    time: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },
    operation: {
      type: DataTypes.ENUM,
      values: ["accept", "denied"],
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM,
      values: []
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
    },
    ref: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  relationships: [
    {
      type: 'belongsTo',
      model: 'User',
      name: 'user',
      options: {
        foreignKey: 'userId',
        target: 'id',
      } as any,
    },
  ],
  options: {
    tableName: 'auth-logs',
    indexes: [
      {
        fields: ['userId', 'operation', 'type'],
      },
    ],
    hooks: {
      beforeFind: [
        async function beforeFind(options: FindOptions) {
          return validateFindOptions('AuthLog', options, 'userId');
        },
      ],
      beforeCreate: [
        async function beforeCreate(instance: any, options: FindOptions) {
          return validateMutation(
            'AuthLog',
            MutationType.create,
            options,
            instance,
            undefined,
            false,
          );;
        },
      ],
      beforeUpdate: [
        async function beforeUpdate(instance: any, options: FindOptions) {
          return validateMutation(
            'AuthLog',
            MutationType.update,
            options,
            instance,
            undefined,
            false,
          );
        },
      ],
      beforeDestroy: [
        async function beforeDestroy(instance: any, options: FindOptions) {
          return validateMutation(
            'AuthLog',
            MutationType.destroy,
            options,
            instance,
            undefined,
            false,
          );
        },
      ],
    },
  },
};

export default authLogModel;
