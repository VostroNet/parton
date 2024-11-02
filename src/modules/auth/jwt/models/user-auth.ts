import { IDefinition } from "../../../data/types";


const userAuthModel: IDefinition = {
  define: {
    type: {
      values: ['external-jwt'],
    } as any // upgrade gqlize to support enum values,
  },
};

export default userAuthModel;
