import { RoleDoc } from '../../../modules/core/types';

const adminRole: RoleDoc = {
  default: false,
  schema: {
    w: true,
    d: true,
    models: {
      Config: {
        w: true,
      },
      EventLog: {
        r: true,
      },
      Role: {
        w: true,
      },
      User: {
        w: true,
      },
      UserAuth: {
        w: true,
      },
    },
  },
};

export default adminRole;
