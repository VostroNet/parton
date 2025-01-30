
import path from "path";
import { MigratorArgs } from "../../../../../../src/modules/migration";

export const dependencies = []; // add if this query needs to be run after a dependency
export async function up({
  context: {
    runQueryFile,
  },
}: MigratorArgs) {
  await runQueryFile("core", path.resolve(__dirname, "./create.sql"), {});
  await runQueryFile("core", path.resolve(__dirname, "./insert.sql"), {});
  await runQueryFile("doesnotexist", path.resolve(__dirname, "./no-run.sql"), {});
}

// export async function down({
//   context: {
//     runQueryFile,
//   },
// }: MigratorArgs) {
//   await runQueryFile("core", path.resolve(__dirname, "./down.sql"), {});
// }
