import { DataTypes, Model, ModelStatic, QueryOptions, Sequelize, Transaction } from "sequelize";

import { System } from "../../system";
import { IModule } from "../../types/system";
import waterfall from "../../utils/waterfall";

import { DataConfig, DataEvent, DataEvents, getContextFromOptions, getDatabase, getTableNameFromModel } from ".";
import { DataHookEvent, DataHookEvents, DataModelHookEvents } from "./hooks";
import { AbstractQuery } from "sequelize/lib/dialects/abstract/query";
import { IDefinition } from "./types";


async function createTriggerFunctionQuery(model: ModelStatic<Model<any, any>>, system: System) : Promise<string[]> {

  // TODO: get options for writer user to remove any priviledge of dropping trigger?
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
  const eventLogSchemaPrefix = `"${schema}".`;
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
  const triggerEventName = `tr_ev_${triggerName}`;
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
      // log update or delete protection -- start
      arr.push(`
CREATE OR REPLACE FUNCTION ${eventLogSchemaPrefix}"prevent_update_delete"()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
      RAISE EXCEPTION 'Updates are not allowed on this table.';
  ELSIF (TG_OP = 'DELETE') THEN
      RAISE EXCEPTION 'Deletes are not allowed on this table.';
  END IF;
  RETURN NULL; -- Skip the operation.
END;
$$ LANGUAGE plpgsql;`);
      // if(system.getConfig<DataConfig>().data.reset) {
      //   // arr.push(`DROP TRIGGER IF EXISTS "${triggerEventName}" ON ${schemaPrefix}"${tableName}";`);
      //   // arr.push(`DROP TRIGGER IF EXISTS "${triggerName}" ON ${schemaPrefix}"${tableName}_log";`);
      //   arr.push(`DROP TABLE IF EXISTS ${eventLogSchemaPrefix}"${tableName}_log" CASCADE;`);
      // }
//       arr.push(`
// CREATE TABLE IF NOT EXISTS ${eventLogSchemaPrefix}"${tableName}_log" (
//   "id" uuid default uuid_generate_v4(),
//   "time" TIMESTAMPTZ NOT NULL default now(),
//   "rowId" integer NOT NULL,
//   "operation" VARCHAR(10) NOT NULL, 
//   "data" JSONB,
//   "userId" integer NOT NULL
// );`);
      arr.push(`  
CREATE OR REPLACE TRIGGER "${tableName}_prevent_update_delete_trigger"
BEFORE UPDATE OR DELETE ON ${eventLogSchemaPrefix}"${tableName}_log"
FOR EACH ROW EXECUTE FUNCTION ${eventLogSchemaPrefix}prevent_update_delete();`);
  // log update or delete protection -- end
      if(isTimescale) {
        arr.push(`SELECT create_hypertable('${eventLogSchemaPrefix}"${tableName}_log"', 'time', if_not_exists => TRUE);`);
      }
      arr.push(`CREATE OR REPLACE FUNCTION ${eventLogSchemaPrefix}"${triggerName}"() 
  RETURNS TRIGGER AS $$
  DECLARE current_user_id varchar;
BEGIN
  current_user_id := (SELECT current_setting('parton.current_user_id'));
  
  IF (current_user_id IS NULL or current_user_id = '') THEN
    RAISE EXCEPTION 'User id is required.';
  END IF;
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time", "rowId", operation, data, "userId")
    VALUES (now(), OLD.id, 'DELETE', NULL, current_user_id::int);
    RETURN OLD;
  ELSEIF (TG_OP = 'UPDATE') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time", "rowId", operation, data, "userId")
    VALUES (now(), NEW.id, 'UPDATE', row_to_json(NEW), current_user_id::int);
    RETURN NEW;
  ELSEIF (TG_OP = 'INSERT') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time", "rowId", operation, data, "userId")
    VALUES (now(), NEW.id, 'INSERT', row_to_json(NEW), current_user_id::int);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE 'plpgsql' COST 100 VOLATILE NOT LEAKPROOF; `);
    arr.push(`DO $$ BEGIN
CREATE OR REPLACE TRIGGER "${triggerEventName}"
  BEFORE INSERT OR UPDATE OR DELETE 
  ON ${schemaPrefix}"${tableName}"
  FOR EACH ROW
    EXECUTE PROCEDURE ${eventLogSchemaPrefix}"${triggerName}"();
EXCEPTION
  WHEN others THEN null;
END $$;`);
    break;
  }
  return arr;
}


export const eventLogModule: IModule & DataEvents & DataModelHookEvents & DataHookEvents = {
  name: "event-logs",
  dependencies: ["data"],
  [DataHookEvent.BeforeSave]: async(instance: Model<any, any>, options: any, modelName: string, system: System) => {
    await beforeSave(options, system)
    return instance;
  },
  [DataHookEvent.AfterSave]: (instance: Model<any, any>, options: any, modelName: string, system: System) => {
    console.log("afterSave", instance, options, modelName);
    afterSave(options, system);
    return instance;
  },
  [DataHookEvent.BeforeBulkCreate]: async(
    instances: Model<any, any>[],
      options: any,
      modelName: string,
      system: System
    ) => {
    await beforeSave(options, system);
    return instances; 
  },
  [DataHookEvent.AfterBulkCreate]: async(
    instances: Model<any, any>[],
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
    return instances;
  },
  [DataHookEvent.BeforeBulkDestroy]: async(
    options: any,
    modelName: string,
    system: System
  ) => {
    await beforeSave(options, system);
  },
  [DataHookEvent.AfterBulkDestroy]: async(
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
  },
  [DataHookEvent.BeforeBulkUpdate]: async(
    options: any,
    modelName: string,
    system: System
  ) => {
    await beforeSave(options, system);
  },
  [DataHookEvent.AfterBulkUpdate]: async(
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
  },
  [DataEvent.ConfigureComplete]: async (models, system) => {
    // const db = await getDatabase(system);
    await waterfall(Object.keys(models)
      .filter((modelName) => {
        const model = models[modelName] as IDefinition;
        return !model.disableEventLog;
      })
    , async (modelName: string) => {
      const modelDef = models[modelName] as IDefinition & {logTableName: string};
      (models[modelName] as IDefinition & {logTableName: string}).logTableName = `${modelDef.options?.tableName || modelName.toLowerCase()}_log`
      const def: IDefinition = {
        name: `${modelName}Log`,
        disableEventLog: true,
        define: {
          time: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.fn("NOW"),
          },
          rowId: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          operation: {
            type: DataTypes.ENUM,
            values: ["INSERT", "UPDATE", "DELETE"],
            allowNull: false,
          },
          data: {
            type: DataTypes.JSONB,
            allowNull: true,
          },
          userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
        },
        disablePrimaryKey: true,
        options: {
          timestamps: false,
          tableName: `${(modelDef.options?.tableName || modelName.toLowerCase())}_log`,
        } as any
      };
      models[def.name] = def;

    });
    return models;
  },
  [DataEvent.Connected]: async (system) => {
    const db = await getDatabase(system);
    // if (system.getConfig<DataConfig>().data.sequelize.dialect === "postgres") {
    //   await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await waterfall(Object.keys(db.models).filter((modelName) => {
      const model = db.models[modelName];
      //IDefinition & {logTable: boolean}
      return !model.definition.disableEventLog;
    }), async (modelName: string) => {
      system.logger.debug("Creating trigger for model", modelName);
      const model = db.models[modelName];
      // const tableName = model.getTableName();
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
    
  },
  // [DataHookEvent.BeforeQuery]: async function(options: QueryOptions, query: AbstractQuery, system: System, module: IModule) {
  //   console.log("beforeQuery", arguments);
  // }

}
async function beforeSave(
  options: any,
  system: System
) {
  
  if (!options) {
    throw new Error("Options is required");
  }
  const db = await getDatabase(system);

  const context = getContextFromOptions(options);
  const currentUser = await context.getUser();
  if (!currentUser) {
    throw new Error("User is required to save data");
  }
  switch (system.getConfig<DataConfig>().data.sequelize.dialect) {
    case "postgres":
      const parent = options.transaction;
      if(!options.transaction) {
        const t = await db.transaction({
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
          transaction: parent,
        });
        t.afterCommit(() => {
          // console.log("afterCommit");
          options.transaction = parent;
        });
        options.transaction = t;
        options.immediate = true;
      }
      system.logger.debug("Setting current user id", currentUser.id);
      if (currentUser?.id > 0 || currentUser?.id !== -1) {
        if (options.immediate) {
          await options.transaction?.rollback();
        }
        throw new Error("User id is required.");
      }
      await db.query("SET LOCAL parton.current_user_id = :currentUserId;", {
        replacements: {
          currentUserId: `${currentUser.id}`,
        },
        transaction: options.transaction,
      });
      break;
  }
}
async function afterSave(options: {transaction: Transaction, immediate: boolean}, system: System) {
  
  // console.log("afterSave", options);
  if (options.immediate) {
    system.logger.debug("event log - committing transaction");
    await options.transaction?.commit();
  }
}


export default eventLogModule;