import { GraphQLString } from "graphql";
import { toGlobalId } from "graphql-relay";
import { SignJWT } from "jose";

import { JwtConfig } from "..";
import { User } from "../../../types/models/models/user";
import { Context } from "../../../types/system";
import { createOptions } from "../../data";
import { getDefinition } from "../../data/utils";
import { getSystemFromContext } from "../../../system";
import { IDefinition } from "../../data/types";

export interface IJwtFieldsDefinition extends IDefinition {
  jwtFields?: string[];
}



const user: IJwtFieldsDefinition = {
  jwtFields: ["userName", "email"],
  expose: {
    instanceMethods: {
      query: {
        jwtToken: {
          type: GraphQLString,
          args: {
            expiresIn: {
              type: GraphQLString,
            },
          },
        },
      },
    },
  },
  options: {
    instanceMethods: {
      async jwtToken(this: User, args: { expiresIn?: string | number | Date }, context: Context) {
        const system = await getSystemFromContext(context);
        const authConfig = system.getConfig<JwtConfig>()
        const privateKey = authConfig?.auth?.jwt.privateKey;
        if (!privateKey) {
          // TODO: return supplied jwt token, or retrieve something from user-auths?
          // const userAuths = await this.getAuths(createOptions(context, {
          //   where: {
          //     type: "external-jwt",
          //   },
          // }));
          // if (userAuths.length > 0) {
          //   // TODO: validate token
          //   return userAuths[0].token;
          // }
          throw new Error("No privateKey found, unable to sign jwt");
        }
        const definition = getDefinition<IJwtFieldsDefinition>("User", system);
        let fields = definition?.jwtFields;
        if (!fields) {
          // no fields defined,
          fields = ["userName", "email"];
        }
        // const privateKey = await importJWK(jwksConfig.privateKey,  "RS256");
        const role = await this.getRole(createOptions(context, {}));
        const token = Object.keys(this.dataValues)
          .filter(key => fields.indexOf(key) > -1)
          .reduce((obj, key) => {
            obj[key] = this[key];
            return obj;
          }, {});

        const jwt = new SignJWT({
          ...token,
          "userId": toGlobalId("User", this.id),
          "role": role.name,
        })
          .setProtectedHeader({ alg: "ES256" })
          .setIssuedAt()
          .setSubject(this.userName);
        if (args.expiresIn) {
          jwt.setExpirationTime(args.expiresIn);
        }
        return await jwt.sign(privateKey);
      },
    },
  },
};

export default user;
