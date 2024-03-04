import { describe, expect, test } from '@jest/globals';

import merge from '../../src/utils/merge';

describe("utils:merge", () => {
  test('execution', async () => {
    const result = merge({a: 1}, {b: 2}) as any;
    expect(result.a).not.toBeNull()
    expect(result.b).not.toBeNull()
  });
  test('overriding property', async () => {
    const result = merge({a: 1}, {a: 2}) as any;
    expect(result.a).toBe(2);
  });
});
