import { describe, expect, test } from '@jest/globals';

import httpModule, { HttpEventType } from '../../src/modules/http';
import { System } from '../../src/system';
import "../../__mocks__/http";

describe('modules:http', () => {
  test('event firing order', async () => {
    const arr: string[] = [];

    try {
      const core = new System({
        name: 'http-test',
        slices: [httpModule, 
          {
            name: 'test1',
            [HttpEventType.Initialize]: async (core: System) => {
              arr.push('initialize');
              return core;
            },
            [HttpEventType.Ready]: async (core: System) => {
              arr.push('ready');
              return core;
            },
          }
        ]
      });
      await core.load();
      await core.initialize();
      await core.ready();
      await core.shutdown();
    } catch(err: any) {
      expect(err).toBeUndefined();
    }
    expect(arr).toHaveLength(2);
    expect(arr[0]).toBe('initialize');
    expect(arr[1]).toBe('ready');
  });
});
