import { GraphQLString } from "graphql";
import { toGlobalId } from "graphql-relay";
import { SignJWT} from "jose";

import { JwtConfig } from "..";
import { Context } from "../../../../types/system";
import { IDefinition } from "../../../core/types";
import { createOptions, getSystemFromContext } from "../../../data";

const user: IDefinition = {
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
      async jwtToken(args: any, context: Context) {
        const system = await getSystemFromContext(context);
        const authConfig = system.getConfig<JwtConfig>()
        const jwksConfig = authConfig?.auth?.jwks;
        if(!jwksConfig) {
          throw new Error("No jwks config found");
        }
        // const privateKey = await importJWK(jwksConfig.privateKey,  "RS256");
        const role = await this.getRole(createOptions(context, {}));
        const jwt = await new SignJWT({
          "userId": toGlobalId("User", this.id),
          "role": role.name,
        })
          .setProtectedHeader({alg: "ES256"})
          .setIssuedAt()
          .setSubject(this.userName)
          .sign(jwksConfig.privateKey);
        return jwt;
      },
    },
  },
};

export default user;
