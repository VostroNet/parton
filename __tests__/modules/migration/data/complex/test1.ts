import { MigratorFile } from "../../../../../src/modules/migration";

const migrationObj: MigratorFile = {
  name: 'complex_test1',
  async up(args) {
    const { runQuery } = args.context;
    await runQuery(undefined, 'CREATE TABLE complex_table (id INTEGER PRIMARY KEY, name TEXT);');
    await runQuery(undefined, `INSERT INTO complex_table (id, name) VALUES (1, 'test');`);
  },
  async down() { },
};
export default migrationObj;