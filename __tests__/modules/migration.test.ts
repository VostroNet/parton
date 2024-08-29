import { describe, expect, test } from '@jest/globals';

import { migrationModule } from '../../src/modules/migration';
import { System } from '../../src/system';
import "../../__mocks__/http";

describe('modules:migrations', () => {
  test('event firing order', async () => {
    const arr: string[] = [];

    try {
      const core = new System({
        name: 'http-test',
        slices: [migrationModule]
      });
      await core.load();
      await core.initialize();
      await core.ready();
      await core.shutdown();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    expect(arr).toHaveLength(2);
    expect(arr[0]).toBe('initialize');
    expect(arr[1]).toBe('ready');
  });
});
