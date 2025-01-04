import bcrypt from 'bcrypt';

import DataTypes from '../../../types/data-types';
import { getContextFromOptions } from '../../data';
import { FindOptions, IDefinition } from '../../data/types';
import { validateFindOptions, validateMutation } from '../../data/validation';
import { MutationType } from '../../core/types';

const userAuthModel: IDefinition = {
  name: 'UserAuth',
  comment: 'This is the user auth table',
  comments: {
    fields: {
      name: 'This is the name of user auth that will be displayed.',
      type: 'This is the type of user auth for organized identification.',
      token:
        'This is the token that is being generated for every user type and user.',
    },
  },
  define: {
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'This is the name of user auth that will be displayed.',
    },
    type: {
      //TODO: update gqlize to support enum
      type: DataTypes.ENUM,
      values: ['local'],
      allowNull: false,
      comment: 'This is the type of user auth for organized identification.',
    } as any,
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment:
        'This is the token that is being generated for every user type and user.',
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
    tableName: 'user-auths',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'type', 'token'],
      },
    ],
    hooks: {
      beforeFind: [
        async function beforeFind(options: FindOptions) {
          return validateFindOptions('UserAuth', options, 'userId');
        },
      ],
      beforeCreate: [
        async function beforeCreate(instance: any, options: FindOptions) {
          instance = await validateMutation(
            'UserAuth',
            MutationType.create,
            options,
            instance,
            undefined,
            false,
          );
          if (instance.type === 'local' || instance.type === 'bearer') {
            instance._token = instance.token;
            const salt = await bcrypt.genSalt(5);
            instance.token = await bcrypt.hash(instance.token, salt);
          }
          return instance;
        },
      ],
      beforeUpdate: [
        async function beforeUpdate(instance: any, options: FindOptions) {
          instance = await validateMutation(
            'UserAuth',
            MutationType.update,
            options,
            instance,
            undefined,
            false,
          );

          if (instance.type === 'local' || instance.type === 'bearer') {
            instance._token = instance.token;
            const salt = await bcrypt.genSalt(5);
            instance.token = await bcrypt.hash(instance.token, salt);
          }
          return instance;
        },
      ],
      beforeDestroy: [
        async function beforeDestroy(instance: any, options: FindOptions) {
          return validateMutation(
            'UserAuth',
            MutationType.destroy,
            options,
            instance,
            undefined,
            false,
          );
        },
      ],
      afterFind: [
        async function afterFind(instance: any, options: FindOptions) {
          const context = getContextFromOptions(options);
          if (context.override || options.override) {
            return instance;
          }

          if (Array.isArray(instance)) {
            return instance.map((i) => {
              i.token = '';
              return i;
            });
          } else if (instance) {
            instance.token = '';
          }
          return instance;
        },
      ],
    },
  },
};

export default userAuthModel;
