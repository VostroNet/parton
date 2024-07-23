import { test } from "@jest/globals";

export const testIf = (condition, ...args: any) =>
  // eslint-disable-next-line prefer-spread
  condition ? test.apply(undefined, args) : test.skip.apply(undefined, args);

export function postgresCheck() {
  return process.env.DB_TYPE === "postgres";
}