// import {Redis, RedisOptions} from 'ioredis';

// import { System } from '../../system';
// import { CacheEventType, ICacheSource } from '../cache';
// import { IModule } from '../../types/system';

// export enum RedisEventType {
//   Initialize = 'redis:initialize',
// }

// export type RedisModuleEvents = {
//   [key in RedisEventType]?: (redis: Redis, core: System) => Promise<void>;
// };

// export interface RedisModule extends IModule, RedisModuleEvents {
//   redis: Redis;
// }

// export function createRedisSource(name = 'redis') {

// }

// export default class RedisSource implements ICacheSource, RedisModule {
//   name: 'redis'
//   alias: string
//   redis: Redis
//   options: RedisOptions
//   ignore: ['get', 'set', 'delete', 'clear', 'has']
//   constructor(alias: string, options: RedisOptions) {
//     this.alias = alias;
//     this.options = options;
//   }
//   [SystemEvent.Initialize] = async(core: System) => {
//     this.redis = new Redis(this.options)
//     Object.keys(RedisEventType).forEach((element) => {
//       core.setOptions(RedisEventType[element], {
//         ignoreReturn: true
//       });
//     });

//     await core.execute(RedisEventType.Initialize, this.redis, core);
//     await core.execute(CacheEventType.RegisterSource, this, core);
//     return core;
//   }
//   get = async (key: string) => {
//     return this.redis.get(key);
//   }
//   set = async (key: string, value: any, expiry?: number) => {
//     if (expiry) {
//       await this.redis.set(key, value, 'EX', expiry);
//       return;
//     }
//     await this.redis.set(key, value);
//     return;
//   }
//   delete = async (key: string) => {
//     await this.redis.del(key);
//   }
//   clear = async () => {
//     await this.redis.flushall();
//   }
//   has = async (key: string) => {
//     return (await this.redis.exists(key)) > 0;
//   }

// }

// // export const redisModule: RedisModule = {
// //   name: 'redis',
// //   // dependencies: ['http'],
// //   // incompatible: ['cli'],
// //   redis: undefined,
// //   [SystemEvent.Initialize]: async (core: System) => {
// //     const redisApp = new Redis()
// //     Object.keys(RedisEventType).forEach((element) => {
// //       core.setOptions(RedisEventType[element], {
// //         ignoreReturn: true
// //       });
// //     });

// //     await core.execute(RedisEventType.Initialize, redisApp, core);
// //     await core.execute(CacheEventType.RegisterSource, redisApp, core);
// //     return core;
// //   },

// // };
// // export default redisModule;
