import { GraphQLSchema } from 'graphql';
import { createYoga, YogaServerInstance } from 'graphql-yoga';

import { System } from '../system';
import { Role } from '../types/models/models/role';
import { IModule } from '../types/system';
import { createHexString } from '../utils/string';

import { CoreModuleEvent as CoreModuleEvent, CoreModuleEvents } from './core';
import { ExpressEvent, ExpressModuleEvents } from './express';

// export enum YogaEventType {
//   Initialize = 'yoga:initialize',
// }

// export type RedisModuleEvents = {
//   [key in RedisEventType]?: (redis: Redis, core: System) => Promise<void>;
// };

export interface IYogaModule
  extends IModule,
    CoreModuleEvents,
    ExpressModuleEvents {
  servers: { [key in string]: YogaServerInstance<any, any> };
  defaultId?: number;
}

export const yogaModule: IYogaModule = {
  name: 'yoga',
  dependencies: ['express'],
  servers: {},
  [CoreModuleEvent.GraphQLSchemaCreate]: async (
    schema: GraphQLSchema,
    role: Role,
    system: System,
  ) => {
    const hexId = createHexString(role.id);
    if (system.get<IYogaModule>('yoga').servers[hexId]) {
      delete system.get<IYogaModule>('yoga').servers[hexId];
    }
    const yoga = createYoga({
      schema,
      batching: true,
      context: {},
      graphiql: true,
      graphqlEndpoint: `/graphql.api/${hexId}`,
    });
    system.get<IYogaModule>('yoga').servers[hexId] = yoga;
    if (role.default) {
      system.get<IYogaModule>('yoga').defaultId = role.id;
    }
  },
  [ExpressEvent.Initialize]: async (express, system) => {
    express.use(async (req, res, next) => {
      try {
        if (req.url.startsWith('/graphql.api')) {
          let roleId = (req as any).session?.roleId;
          if (!roleId) {
            roleId = system.get<IYogaModule>('yoga').defaultId;
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
