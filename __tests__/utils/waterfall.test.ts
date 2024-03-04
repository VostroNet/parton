import { describe, expect, test } from '@jest/globals';

import waterfall from '../../src/utils/waterfall';

describe("utils:waterfall", () => {

  test('execution', async () => {
    let result = "";
    await waterfall(["answer"], (arg) => {
      result = arg;
      return result;
    });
    expect(result).toBe("answer");
  });
});
