import bcrypt from 'bcrypt';
import { IDefinition } from '../../data/types';
import { Context } from '../../../types/system';
import { buildOptions, getDatabase } from '../../data';
import DatabaseContext from '../../../types/models';
import { getSystemFromContext } from '../../../system';
import { Op, Sequelize } from 'sequelize';


const userAuthModel: IDefinition = {
  define: {
    type: {
      values: ['local'],
    } as any // upgrade gqlize to support enum values,
  },
  hooks: {
    beforeCreate: [
      async function beforeCreate(instance: any) {
        if (instance.type === 'local') {
          instance._token = instance.token;
          const salt = await bcrypt.genSalt(5);
          instance.token = await bcrypt.hash(instance.token, salt);
        }
        return instance;
      },
    ],
    beforeUpdate: [
      async function beforeUpdate(instance: any) {
        if (instance.type === 'local' && instance.changed('token')) {
          instance._token = instance.token;
          const salt = await bcrypt.genSalt(5);
          instance.token = await bcrypt.hash(instance.token, salt);
        }
        return instance;
      },
    ],
  },
  options: {
    classMethods: {
      async loginWithUsernamePassword(args: { username: string, password: string }, context: Context) {
        const { username, password } = args;
        const system = getSystemFromContext(context);
        const db = await getDatabase<DatabaseContext>(system);
        const { UserAuth, Role, User } = db.models;
        // const context = await createContext(system, undefined, undefined, undefined, true);

        const userAuths = await UserAuth.findAll(
          buildOptions(context, {
            where: {
              type: 'local',
            },
            include: [{
              model: User,
              as: 'user',
              required: true,
              where: {
                [Op.or]: [
                  Sequelize.where(Sequelize.fn('lower', Sequelize.col('userName')), username.toLowerCase().trim()),
                  Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), username.toLowerCase().trim()),
                ],
              },
              include: [{
                required: true,
                model: Role,
                as: 'role',
              }],
            }],
          }),
        );

        if (!userAuths) {
          return undefined;
        }
        const userAuth = userAuths.find((ua) =>
          bcrypt.compareSync(password, ua.token),
        );
        if (userAuth) {
          const user = userAuth.user;
          return user;
        }
        return undefined;
      }
    }
  }
};

export default userAuthModel;
