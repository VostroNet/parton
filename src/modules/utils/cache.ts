// import { System } from '../../system';
// import { IModule } from '../../types/system';

// import { DataModule } from '../data/index';

// export interface ICacheSource extends IModule {
//   alias: string;
//   get: (key: string) => Promise<any>;
//   set: (key: string, value: any, expiry?: number) => Promise<void>;
//   delete: (key: string) => Promise<void>;
//   clear: () => Promise<void>;
//   has: (key: string) => Promise<boolean>;
// }

// export enum CacheEventType {
//   Initialize = 'cache:initialize',
//   RegisterSource = 'cache:register:source',
//   HasSource = 'cache:has:source',
//   Ready = 'cache:ready',
// }
// // type CacheModuleEventsMap = {
// //   [key in CacheEventType]?: (cache: CacheModule, core: System) => Promise<void>;
// // }

// export interface CacheModuleEvents {
//   [CacheEventType.Initialize]?: (
//     cache: CacheModule,
//     core: System,
//   ) => Promise<void>;
//   [CacheEventType.Ready]?: (cache: CacheModule, core: System) => Promise<void>;
//   [CacheEventType.RegisterSource]?: (
//     source: ICacheSource,
//     core: System,
//   ) => Promise<void>;
//   [CacheEventType.HasSource]?: (
//     source: ICacheSource,
//     core: System,
//   ) => Promise<void>;
// }

// export interface CacheModule extends DataModule, CacheModuleEvents {
//   defaultCache: string;
//   caches: { [key in string]: ICacheSource };

//   get: <T>(key: string, cacheName?: string) => Promise<T>;
//   set: (
//     key: string,
//     value: any,
//     expiry?: number,
//     cacheName?: string,
//   ) => Promise<void>;
//   delete: (key: string, cacheName?: string) => Promise<void>;
//   clear: (cacheName?: string) => Promise<void>;
//   has: (key: string, cacheName?: string) => Promise<boolean>;
// }

// // class cacheModule implements CacheModule {
// //   name: 'cache'
// //   dependencies: []
// //   // incompatible: ['cli'],
// //   caches: {}
// //   defaultCache: 'default'
// //   ignoreFunctions: ['get', 'set', 'delete', 'clear', 'has']
// //   constructor() {
// //     this.name = 'cache';
// //     this.dependencies = [];
// //     this.caches = {};
// //     this.defaultCache = 'default';
// //     this.ignoreFunctions = ['get', 'set', 'delete', 'clear', 'has'];
// //   }
// //   readonly [SystemEvent.Initialize] = async (core: System) => {

// //     await core.execute(CacheEventType.Initialize, this, core);
// //     if (Object.keys(this.caches).length === 0) {
// //       core.logger.warn("cache", "No cache sources registered");
// //     }
// //     await core.execute(CacheEventType.Ready, this, core);
// //     return core;
// //   }
// //   readonly [CacheEventType.RegisterSource] = async (source: ICacheSource, core: System) => {
// //     core.logger.info("cache", `Registering cache source ${source.name}`);
// //     if(!this.caches) {
// //       this.caches = {};
// //     }
// //     this.caches[source.name] = source;
// //     await core.execute(CacheEventType.HasSource, source, this, core);
// //     return;
// //   }
// //   readonly [DataEventType.Configure] = async (config: any, core: System) => {
// //     core.logger.info("cache", "Configuring cache");
// //     return config;
// //   }
// //   readonly get = async<T>(key: string, cacheName?: string): Promise<T> => {

// //     if(!cacheName) {
// //       cacheName = this.defaultCache;
// //     }
// //     return this.caches[cacheName].get(key);
// //   }
// //   readonly set = async(key: string, value: any, expiry?: number, cacheName?: string): Promise<void> => {
// //     if(!cacheName) {
// //       cacheName = this.defaultCache;
// //     }
// //     return this.caches[cacheName].set(key, value, expiry);
// //   }
// //   readonly clear = async(cacheName?: string): Promise<void> => {
// //     if(!cacheName) {
// //       cacheName = this.defaultCache;
// //     }
// //     return this.caches[cacheName].clear();
// //   }
// //   readonly has = (key: string, cacheName?: string) :Promise<boolean> => {
// //     if(!cacheName) {
// //       cacheName = this.defaultCache;
// //     }
// //     return this.caches[cacheName].has(key);
// //   }
// //   readonly delete = (key: string, cacheName?: string) : Promise<void> => {
// //     if(!cacheName) {
// //       cacheName = this.defaultCache;
// //     }
// //     return this.caches[cacheName].delete(key);
// //   }
// // }

// // // export const cacheModule: CacheModule = {
// // //   name: 'cache',
// // //   dependencies: ['data', {
// // //     oneOf: ['redis', 'memory']
// // //   }],
// // //   // incompatible: ['cli'],
// // //   caches: {},
// // //   [SystemEvent.Initialize]: async (core: System) => {
// // //     await core.execute(CacheEventType.Initialize, this, core);
// // //     return core;
// // //   },
// // //   [CacheEventType.RegisterSource]: async (source: ICacheSource, core: System) => {
// // //     core.logger.info(`Registering cache source ${source.name}`);
// // //     const cacheModule = core.modules.cache as CacheModule;
// // //     if(!cacheModule.caches) {
// // //       cacheModule.caches = {};
// // //     }
// // //     cacheModule.caches[source.name] = source;
// // //     return;
// // //   },
// // //   [DataEventType.Configure]: async (config: any, core: System) => {
// // //     core.logger.info("Configuring cache");
// // //     return config;
// // //   },
// // //   async get<T>(key: string, cacheName?: string): Promise<T> {
// // //     const cacheModule = this as CacheModule;
// // //     if(!cacheName) {
// // //       cacheName = cacheModule.defaultCache;
// // //     }
// // //     return this.cache[cacheName].get(key);
// // //   },
// // //   async set(key: string, value: any, expiry?: number, cacheName?: string): Promise<void> {
// // //     const cacheModule = this as CacheModule;
// // //     if(!cacheName) {
// // //       cacheName = cacheModule.defaultCache;
// // //     }
// // //     return this.cache[cacheName].set(key, value, expiry);
// // //   },
// // //   async clear(cacheName?: string): Promise<void> {
// // //     const cacheModule = this as CacheModule;
// // //     if(!cacheName) {
// // //       cacheName = cacheModule.defaultCache;
// // //     }
// // //     return this.cache[cacheName].clear();
// // //   }

// // // };
// // export default new cacheModule;
