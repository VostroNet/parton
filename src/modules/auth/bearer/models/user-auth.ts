import bcrypt from 'bcrypt';

import { IDefinition } from "../../../core/types";

const userAuthModel: IDefinition = {
  define: {
    type: {
      values: ['bearer'],
    } as any // upgrade gqlize to support enum values,
  },
  hooks: {
    beforeCreate: [
      async function beforeCreate(instance: any) {
        if (instance.type === 'bearer') {
          instance._token = instance.token;
          const salt = await bcrypt.genSalt(5);
          instance.token = await bcrypt.hash(instance.token, salt);
        }
        return instance;
      },
    ],
    beforeUpdate: [
      async function beforeUpdate(instance: any) {
        if (instance.type === 'bearer') {
          instance._token = instance.token;
          const salt = await bcrypt.genSalt(5);
          instance.token = await bcrypt.hash(instance.token, salt);
        }
        return instance;
      },
    ],
  }
};

export default userAuthModel;
