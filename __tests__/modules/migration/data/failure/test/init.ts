
import path from "path";

import { MigratorArgs } from "../../../../../../src/modules/migration";
export const dependencies = []; // add if this query needs to be run after a dependency
export async function up({
  context: {
    runQueryFile,
  },
}: MigratorArgs) {
  await runQueryFile("core", path.resolve(__dirname, "./create.sql"), {});
  await runQueryFile("core", path.resolve(__dirname, "./fail.sql"), {});
}

export async function upRollback({
  context: {
    runQueryFile,
  },
}: MigratorArgs) {
  await runQueryFile("core", path.resolve(__dirname, "./rollback.sql"), {});
}

// export async function down({
//   context: {
//     runQueryFile,
//   },
// }: MigratorArgs) {
//   // await runQueryFile("core", path.resolve(__dirname, "./down.sql"), {});
// }
