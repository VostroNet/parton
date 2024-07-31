import { fromGlobalId } from "graphql-relay";
import { JWTPayload } from "jose";
import { Op } from "sequelize";

import { System } from "../../../system";
import { Context } from "../../../types/system";
import { createOptions, getDatabase } from "../../data";
import { getDefinition } from "../../data/utils";

import { IJwtFieldsDefinition } from "./models/user";

import { JwtConfig } from ".";
import DatabaseContext from "../../../types/models";

export interface JwtToken extends JWTPayload {
  userId: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
  source?: string;
}

export async function getUserFromToken(token: JwtToken, system: System, context: Context) {
  const db = await getDatabase<DatabaseContext>(system);
  const { User, Role, UserAuth } = db.models;
  const where: any = {};
  if (token.userId) {
    const { id } = fromGlobalId(token.userId);
    where.id = {
      [Op.eq]: id,
    };
  } else if (token.email) {
    where.email = {
      [Op.eq]: token.email,
    };
  }
  let user = await User.findOne(createOptions(context, {
    where,
    include: [{
      model: Role,
      as: "role",
    }],
  }));
  if (!user) {
    const cfg = await system.getConfig<JwtConfig>();
    if (cfg?.auth?.jwks?.autoCreateUser) {
      const role = await Role.findOne(createOptions(context, {
        where: {
          name: token.role,
        },
      }));
      if (role) {
        const definition = getDefinition<IJwtFieldsDefinition>("User", system);
        let fields = definition?.jwtFields;
        if (!fields) {
          // no fields defined,
          fields = ["userName", "email"];
        }
        const userVars = Object.keys(token)
          .filter(key => fields.indexOf(key) > -1)
          .reduce((obj, key) => {
            obj[key] = token[key];
            return obj;
          }, {});

        user = await User.create({
          ...userVars,
          roleId: role.id,
        }, createOptions(context));
        await UserAuth.create({
          userId: user.id,
          name: token.source || "jwt",
          type: "external-jwt",
          token: token.userId,
        }, createOptions(context));
      }
    }
  }
  return user;
}