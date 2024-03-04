// import { describe, test, expect } from '@jest/globals';
// import {  System } from '../../src/system';
// import  { CacheEventType, CacheModule, CacheModuleEvents, ICacheSource } from '../../src/modules/cache';
// import { IModule } from '../../src/types/system';

import { describe, expect, test } from "@jest/globals";

// interface CacheTestModule extends CacheModuleEvents, IModule {}

// describe('modules:cache', () => {
//   test('cache register source', async () => {
//     const arr = [];
//     const testModule: CacheTestModule = {
//       name: 'test1',
//       [CacheEventType.Initialize]: async (_cacheModule: CacheModule, _system: System) => {
//         arr.push('initialize');
//       },
//       [CacheEventType.HasSource]: async (_cacheModule: ICacheSource, _system: System) => {
//         arr.push('hasSource');
//       }
//     };
//     const core = new System({
//       name: 'cache-test',
//       modules: [cache, testModule]
//     });
//     await core.load();
//     await core.initialize();
//     await core.execute(CacheEventType.RegisterSource, {name: "hi"}, core);
//     expect(arr).toHaveLength(2);
//     expect(arr[0]).toBe('initialize');
//     expect(arr[1]).toBe('hasSource');
//     expect(core.modules.cache).toBeDefined();
//   });
// });
describe("cache", () => {
  test("tmp", () => {
    expect(true).toBe(true);
  })
});