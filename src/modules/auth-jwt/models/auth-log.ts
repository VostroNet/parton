import { DataTypes } from "sequelize";
import { IDefinition } from "../../data/types";

const authLogModel: IDefinition = {
  define: {
    type: {
      type: DataTypes.ENUM,
      values: ["jwt"]
    },
  },
};

export default authLogModel;
