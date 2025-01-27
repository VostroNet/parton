import { DataTypes } from "sequelize";
import { IDefinition } from "../../data/types";

const authLogModel: IDefinition = {
  define: {
    type: {
      type: DataTypes.ENUM,
      values: ["local"]
    },
  },
};

export default authLogModel;
