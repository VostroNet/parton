import { RoleDoc } from "../../../../src/modules/core/types";

const adminRole: RoleDoc = {
  default: true,
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
