import { describe, expect, test } from '@jest/globals';
import { LoafEvent } from '@azerothian/sandwich';

import { System } from '../../../src/system';
import { SystemEvent } from '../../../src/types/events';


describe('modules:core', () => {
  test('event firing order', async () => {
    const arr: string[] = [];
    const system = new System({
      name: 'core-test',
      slices: [
        {
          name: 'test1',
          [LoafEvent.Load]: async () => {
            arr.push('load');
          },
          [SystemEvent.Initialize]: async (system: System) => {
            arr.push('initialize');
            return system;
          },
          [SystemEvent.Ready]: async (system: System) => {
            arr.push('ready');
            return system;
          }
        }
      ]
    });
    await system.load();
    expect(arr).toHaveLength(1);
    expect(arr[0]).toBe('load');
    await system.initialize();
    await system.ready();
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe('load');
    expect(arr[1]).toBe('initialize');
    expect(arr[2]).toBe('ready');
    await system.shutdown();
  });
});