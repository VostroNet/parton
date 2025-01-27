
import path from "path";

import { MigratorArgs } from "../../../../../../src/modules/migration";
export const dependencies = []; // add if this query needs to be run after a dependency
export async function up({
  context: {
    runQueryFile,
  },
}: MigratorArgs) {
  await runQueryFile("core", path.resolve(__dirname, "./up.sql"), {});
}

export async function down({
  context: {
    runQueryFile,
  },
}: MigratorArgs) {
  await runQueryFile("core", path.resolve(__dirname, "./down.sql"), {});
}
