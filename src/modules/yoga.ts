import { GraphQLSchema } from 'graphql';
import { createYoga, YogaInitialContext, YogaServerInstance } from 'graphql-yoga';

import { System, SystemContext } from '../system';
import { Context, IModule } from '../types/system';
import { createHexString } from '../utils/string';

import { createContextFromRequest, ExpressEvent, ExpressModuleEvents } from './express';
import { CoreModuleEvent, CoreModuleEvents, IRole } from './core/types';

// export enum YogaEventType {
//   Initialize = 'yoga:initialize',
// }

// export type RedisModuleEvents = {
//   [key in RedisEventType]?: (redis: Redis, core: System) => Promise<void>;
// };


// import { Plugin } from 'graphql-yoga'
 
// function useContext(): Plugin {
//   return {
//     async onContextBuilding(args) {
//       console.log("onContextBuilding", args);
//       return;
//     },
//     onRequestParse(args) {
//       console.log("onRequestParse", args);
//       return;
//     },
//     onRequest(args) {
//       console.log("onRequest", args);
//       return;
//     }
//   }
// }


export interface IYogaModule
  extends IModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  servers: { [key in string]: YogaServerInstance<any, any> };
  defaultId?: number;
}

export interface GraphQLContext extends YogaInitialContext, Context {
  system: System;
}

export const yogaModule: IYogaModule = {
  name: 'yoga',
  dependencies: ['express', {
    optional: {
      before: ["auth"]
    }
  }],
  servers: {},
  [CoreModuleEvent.GraphQLSchemaCreate]: async (
    schema: GraphQLSchema,
    role: IRole,
    system: System,
  ) => {
    const hexId = createHexString(role.id);
    if (system.get<IYogaModule>('yoga').servers[hexId]) {
      delete system.get<IYogaModule>('yoga').servers[hexId];
    }
    const yoga = createYoga({
      schema,
      batching: true,
      context: async (initialContext: GraphQLContext, ...args) => {
        // bodyInit should be the express request passed in.
        const context = await createContextFromRequest((initialContext.request as any).bodyInit, system) as SystemContext;
        return context;
      },
      graphiql: true,
      graphqlEndpoint: `/graphql.api/${hexId}`,
      // plugins: [useContext()],
    });
    system.get<IYogaModule>('yoga').servers[hexId] = yoga;
    return schema
  },
  [ExpressEvent.Initialize]: async (express, system) => {
    express.use(async (req, res, next) => {
      try {
        if (req.url.startsWith('/graphql.api')) {
          const context = await createContextFromRequest(req, system) as SystemContext;
          const roleId = context.role?.id;
          if (!roleId) {
            system.logger.error('yoga', 'No role id found for request');
            return next();
          }
          const hexId = createHexString(roleId);
          if (!system.get<IYogaModule>('yoga').servers[hexId]) {
            return next();
          }
          if (req.url !== `/graphql.api/${hexId}`) {
            req.url = `/graphql.api/${hexId}`;
            req.originalUrl = `/graphql.api/${hexId}`;
          }
          system.get<IYogaModule>('yoga').servers[hexId](req, res);
          return;
        }
        return next();
      } catch (error) {
        system.logger.error('yoga', error);
      }
    });
    return express;
  },
};
export default yogaModule;

// export class YogaModule extends Module implements IYogaModule {
//   servers: {[key in string]: YogaServerInstance<{}, {}>}
//   defaultId?: string
//   constructor(system: System) {
//     super(system);
//     this.name = 'yoga';
//     this.dependencies = ['express'];
//     this.servers = {};
//   }
//   [SystemEvent.Initialize] = async (core: System) => {
//     return core;
//   }
//   readonly [CoreModuleEventType.GraphQLSchemaCreate] = async (schema: GraphQLSchema, role: Role, _system: System) => {
//     const hexId = createHexString(role.id);
//     if (this.servers[hexId]) {
//       delete this.servers[hexId];
//     }
//     const yoga = createYoga({
//       schema,
//       batching: true,
//       context: {},
//       graphiql: true,
//       graphqlEndpoint: `/graphql.api/${hexId}`,
//     })
//     this.servers[hexId] = yoga;
//     if(role.default) {
//       this.defaultId = hexId;
//     }
//   }
//   readonly [ExpressEventType.Initialize] = async (express: Application, system: System) => {
//     express.use(async(req, res, next) => {
//       try {
//         if (req.url.startsWith("/graphql.api")) {
//           const roleId = (req as any).session?.roleId;
//           const hexId = createHexString(roleId);
//           if(!this.servers[hexId]) {
//             return next();
//           }
//           if (req.url !== `/graphql.api/${hexId}`) {
//             req.url = `/graphql.api/${hexId}`;
//             req.originalUrl = `/graphql.api/${hexId}`;
//           }
//           this.servers[hexId](req, res);
//           return next();
//         }
//       } catch (error) {
//         system.logger.error(this.name, error);
//       }
//     });
//     return express;
//   }
// }

// export default YogaModule;
