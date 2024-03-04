import { Model, ModelStatic } from "sequelize";

import { System } from "../../system";
import { IModule } from "../../types/system";
import waterfall from "../../utils/waterfall";

import { DataConfig, DataEvent, DataEvents, getDatabase, getTableNameFromModel } from ".";


async function createTriggerFunctionQuery(model: ModelStatic<Model<any, any>>, system: System) : Promise<string[]> {
  const db = await getDatabase(system);
  const dialect = db.getDialect();
  let isTimescale = false;
  if (dialect === "postgres") {
    const rows: any[] = await db.query(`SELECT * FROM pg_extension where "extname" = 'timescaledb';`);
    if(rows.length > 0) {
      isTimescale = true;
    }
  }
  const {tableName, schema} = getTableNameFromModel(model)
  const schemaPrefix = `"${schema}".`
  // const tableObject = model.getTableName();
  // let tableName = "", schemaPrefix = "";
  // if(typeof tableObject === "string") {
  //   tableName = tableObject;
  // } else {
  //   schemaPrefix = `"${tableObject.schema}"${tableObject.delimiter}`;
  //   tableName = tableObject.tableName;
  // }
  // const tableName = model.getTableName();
  const triggerName = `trg_${tableName}_log`;
  const triggerEventName = `tr_ev_${triggerName}_log`;
  const arr: string[] = [];

  switch(dialect) {
    case "sqlite":
//       arr.push(`CREATE TABLE IF NOT EXISTS ${tableName}_log (
//   "id" text PRIMARY KEY default hex(randomblob(16)),
//   "time" text NOT NULL default now(),
//   "rowId" integer NOT NULL,
//   "operation" VARCHAR(10) NOT NULL,
//   "data" JSONB NOT NULL,
// );`)
//       arr.push(`CREATE TRIGGER IF NOT EXISTS "${triggerName}_insert"
//   AFTER INSERT ON "${tableName}"
// BEGIN
//   columns = PRAGMA (table_info(${tableName}));
//   json = json_object();
//   FOR column IN columns LOOP
//     json = json_set(json, column.name, new.column);
//   END LOOP;
//   INSERT INTO "${tableName}_log" (id, operation, data, "createdAt", "updatedAt")
//     VALUES (hex(randomblob(16)), 'INSERT', json, now(), now());
// END;`);
    break;
    case "postgres":
      arr.push(`CREATE TABLE IF NOT EXISTS ${schemaPrefix}"${tableName}_log" (
  "id" uuid default uuid_generate_v4(),
  "time" TIMESTAMPTZ NOT NULL default now(),
  "rowId" integer NOT NULL,
  "operation" VARCHAR(10) NOT NULL,
  "data" JSONB NOT NULL
);`);
      if(isTimescale) {
        arr.push(`SELECT create_hypertable('${schemaPrefix}"${tableName}_log"', 'time', if_not_exists => TRUE);`);
      }
      arr.push(`CREATE OR REPLACE FUNCTION ${schemaPrefix}"${triggerName}"() 
  RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO ${schemaPrefix}"${tableName}_log" (id, operation, data, "createdAt", "updatedAt")
    VALUES (OLD.id, 'DELETE', row_to_json(OLD), now(), now());
    RETURN OLD;
  ELSE
    INSERT INTO ${schemaPrefix}"${tableName}_log" (id, operation, data, created_at, updated_at)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW), now(), now());
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE 'plpgsql' COST 100 VOLATILE NOT LEAKPROOF; `);
    arr.push(`DO $$ BEGIN
CREATE TRIGGER "${triggerEventName}"
  BEFORE INSERT OR UPDATE 
  ON ${schemaPrefix}"${tableName}"
  FOR EACH ROW
    EXECUTE PROCEDURE ${schemaPrefix}"${triggerName}"();
EXCEPTION
  WHEN others THEN null;
END $$;`);
    break;
  }
  return arr;
}


export const eventLogModule: IModule & DataEvents = {
  name: "event-logs",
  dependencies: ["data"],

  [DataEvent.Loaded]: async (system) => {
    const db = await getDatabase(system);
    
    if(system.getConfig<DataConfig>().data.sequelize.dialect === "postgres") {
      await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    }  
    await waterfall(Object.keys(db.models), async (modelName: string) => {
      const model = db.models[modelName];
      const qArr = await createTriggerFunctionQuery(model, system);
      await waterfall(qArr, async(q) => {
        try {
          await db.query(q)
        } catch(err) {
          console.log("err", err, q); 
          throw err;
        }
      });



    });


  }

}
export default eventLogModule;