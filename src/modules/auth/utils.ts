import { fromGlobalId } from "graphql-relay";
import { Op } from "sequelize";

import { System } from "../../system";
import { Context } from "../../types/system";
import { createOptions, getDatabase } from "../data";

export async function getUserFromToken(token: any, system: System, context: Context) {
  const db = await getDatabase(system);
  const {User, Role} = db.models;
  const where: any = {};
  if (token.userId) {
    const {id} = fromGlobalId(token.userId);
    where.id = {
      [Op.eq]: id,
    };
  } else if (token.email) {
    where.email = {
      [Op.eq]: token.email,
    };
  }
  const user = await User.findOne(createOptions(context, {
    where,
    include: [{
      model: Role,
      as: "role",
    }],
  }));
  return user;
}