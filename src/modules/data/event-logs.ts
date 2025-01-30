import { DataTypes, Model, ModelStatic, QueryOptions, QueryTypes, Sequelize, Transaction } from "sequelize";

import { System } from "../../system";
import { IModule } from "../../types/system";
import waterfall from "../../utils/waterfall";

import { DataConfig, DataEvent, DataEvents, getContextFromOptions, getDatabase, getTableNameFromModel } from ".";
import { DataHookEvent, DataHookEvents, DataModelHookEvents } from "./hooks";
import { IDefinition } from "./types";
import DatabaseContext from "../../types/models";


export interface ILogDefinition extends IDefinition {
  logTableName?: string;
  primaryKeys?: string[];
}




async function createTriggerFunctionQuery(model: ModelStatic<Model<any, any>>, modelDef: ILogDefinition, system: System): Promise<void> {

  try {
    // TODO: get options for writer user to remove any priviledge of dropping trigger?
    const db = await getDatabase(system);
    const dialect = db.getDialect();
    let isTimescale = false;
    if (dialect === "postgres") {
      const rows: any[] = await db.query(`SELECT * FROM pg_extension where "extname" = 'timescaledb';`);
      if (rows.length > 0) {
        isTimescale = true;
      }
    }
    const { tableName, schema } = getTableNameFromModel(model)
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
    // const arr: string[] = [];

    switch (dialect) {
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
        await db.query(`DROP TRIGGER IF EXISTS "${triggerEventName}" ON ${schemaPrefix}"${tableName}";`);
        await db.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON ${schemaPrefix}"${tableName}_log";`);


        // log update or delete protection -- start
        await db.query(`
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



        // arr.push(`DROP TABLE IF EXISTS ${eventLogSchemaPrefix}"${tableName}_log" CASCADE;`);
        // }
        //       arr.push(`
        // CREATE TABLE IF NOT EXISTS ${eventLogSchemaPrefix}"${tableName}_log" (
        //   "id" uuid default uuid_generate_v4(),
        //   "time" TIMESTAMPTZ NOT NULL default now(),
        //   "rowId" integer NOT NULL,
        //   "operation" VARCHAR(10) NOT NULL, 
        //   "data" JSONB,
        //   "userId" integer NOT NULL
        // );`);\
        const readOnlyTriggerName = `${tableName}_prevent_update_delete_trigger`
        const readOnlyTriggerExists = await db.query(`SELECT * FROM pg_trigger WHERE tgname = '${readOnlyTriggerName}';`, { type: QueryTypes.SELECT });
        if (readOnlyTriggerExists.length === 0) {
          await db.query(`  
CREATE TRIGGER "${readOnlyTriggerName}"
BEFORE UPDATE OR DELETE ON ${eventLogSchemaPrefix}"${tableName}_log"
FOR EACH ROW EXECUTE FUNCTION ${eventLogSchemaPrefix}prevent_update_delete();`);
        }
        // log update or delete protection -- end
        if (isTimescale) {
          await db.query(`SELECT create_hypertable('${eventLogSchemaPrefix}"${tableName}_log"', 'time', if_not_exists => TRUE);`);
        }
        // const keys = modelDef.primaryKeys || ["id"];
        const keys = (model as any).primaryKeyAttributes;
        // await db.query(keys.map((pk) => `ALTER TABLE ${eventLogSchemaPrefix}"${tableName}_log" ADD COLUMN IF NOT EXISTS "row_${pk}" integer NOT NULL;`).join("\n"));
        const columns = keys.map((pk) => `"row_${pk}"`).join(",");
        const newFieldsRef = keys.map((pk) => `NEW."${pk}"`).join(",");
        const oldFieldsRef = keys.map((pk) => `OLD."${pk}"`).join(",");
        const loggingFunc = `CREATE OR REPLACE FUNCTION ${eventLogSchemaPrefix}"${triggerName}"() 
  RETURNS TRIGGER AS $$
  DECLARE current_user_id varchar;
BEGIN
  current_user_id := (SELECT current_setting('parton.current_user_id'));
  
  IF (current_user_id IS NULL or current_user_id = '') THEN
    RAISE EXCEPTION 'User id is required.';
  END IF;
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time", operation, data, "userId", ${columns})
    VALUES (now(), 'DELETE', NULL, current_user_id::int, ${oldFieldsRef});
    RETURN OLD;
  ELSEIF (TG_OP = 'UPDATE') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time", operation, data, "userId", ${columns})
    VALUES (now(),'UPDATE', row_to_json(NEW), current_user_id::int, ${newFieldsRef});
    RETURN NEW;
  ELSEIF (TG_OP = 'INSERT') THEN
    INSERT INTO ${eventLogSchemaPrefix}"${tableName}_log" ("time",  operation, data, "userId", ${columns})
    VALUES (now(),'INSERT', row_to_json(NEW), current_user_id::int, ${newFieldsRef});
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE 'plpgsql' COST 100 VOLATILE NOT LEAKPROOF; `;
        await db.query(loggingFunc);
        const triggerExists = await db.query(`SELECT * FROM pg_trigger WHERE tgname = '${triggerEventName}';`, { type: QueryTypes.SELECT });
        if (triggerExists.length === 0) {
          await db.query(`
CREATE TRIGGER "${triggerEventName}"
  BEFORE INSERT OR UPDATE OR DELETE 
  ON ${schemaPrefix}"${tableName}"
  FOR EACH ROW
    EXECUTE PROCEDURE ${eventLogSchemaPrefix}"${triggerName}"();`);
        }
        break;
    }
  } catch (err) {
    console.error("error", err);
    throw err;
  }
}


export const eventLogModule: IModule & DataEvents & DataModelHookEvents & DataHookEvents = {
  name: "event-logs",
  dependencies: ["data"],
  [DataHookEvent.BeforeSave]: async (instance: Model<any, any>, options: any, modelName: string, system: System) => {
    await beforeSave(options, system)
    return instance;
  },
  [DataHookEvent.AfterSave]: (instance: Model<any, any>, options: any, modelName: string, system: System) => {
    console.log("afterSave", modelName);
    afterSave(options, system);
    return instance;
  },
  [DataHookEvent.BeforeBulkCreate]: async (
    instances: Model<any, any>[],
    options: any,
    modelName: string,
    system: System
  ) => {
    await beforeSave(options, system);
    return instances;
  },
  [DataHookEvent.AfterBulkCreate]: async (
    instances: Model<any, any>[],
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
    return instances;
  },
  [DataHookEvent.BeforeBulkDestroy]: async (
    options: any,
    modelName: string,
    system: System
  ) => {
    await beforeSave(options, system);
  },
  [DataHookEvent.AfterBulkDestroy]: async (
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
  },
  [DataHookEvent.BeforeBulkUpdate]: async (
    options: any,
    modelName: string,
    system: System
  ) => {
    await beforeSave(options, system);
  },
  [DataHookEvent.AfterBulkUpdate]: async (
    options: any,
    modelName: string,
    system: System
  ) => {
    afterSave(options, system);
  },
  [DataEvent.ConfigureComplete]: async (models: { [key: string]: ILogDefinition }, system) => {
    // const db = await getDatabase(system);
    const dataConfig = system.getConfig<DataConfig>().data;
    await waterfall(Object.keys(models)
      .filter((modelName) => {
        const model = models[modelName] as IDefinition;
        return !model.disableEventLog;
      })
      , async (modelName: string) => {
        const modelDef = models[modelName];
        let primaryKeys = modelDef.primaryKeys || Object.keys(modelDef.define || {}).filter((key) => {
          return modelDef.define[key].primaryKey;
        });
        if (primaryKeys.length === 0 && !modelDef.primaryKeys && modelDef.disablePrimaryKey && modelDef.define) {
          //hmm not sure about this one
          primaryKeys = Object.keys(modelDef.define).filter((key) => {
            return key.endsWith("Id");
          });
        }
        if (primaryKeys.length === 0) {
          primaryKeys = ["id"];
        }
        models[modelName].logTableName = `${modelDef.options?.tableName || modelName.toLowerCase()}_log`
        const def: IDefinition = {
          name: `${modelName}Log`,
          disableEventLog: true,
          define: {
            time: {
              type: DataTypes.DATE,
              defaultValue: Sequelize.fn("NOW"),
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
            ...(primaryKeys).reduce((acc, key) => {
              acc[`row_${key}`] = {
                type: modelDef.define?.[key]?.type || DataTypes.INTEGER,
                allowNull: false,
              };
              return acc;
            }, {} as any)
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

    const dataConfig = system.getConfig<DataConfig>().data;
    if (dataConfig.sync || dataConfig.reset) {
      const db = await getDatabase<DatabaseContext>(system);
      // if (system.getConfig<DataConfig>().data.sequelize.dialect === "postgres") {
      //   await db.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

      await waterfall(Object.keys(db.models).filter((modelName) => {
        const model = db.models[modelName];
        //IDefinition & {logTable: boolean}
        return !model.definition.disableEventLog;
      }), async (modelName: string) => {
        system.logger.debug("Creating trigger for model", modelName);
        const model = db.models[modelName];
        const modelDef = model.definition;
        // const tableName = model.getTableName();
        await createTriggerFunctionQuery(model, modelDef, system);
      });
    }

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
  if (!context?.getUser) {
    throw new Error("User is required to save data");
  }
  const currentUser = await context?.getUser();
  if (!currentUser) {
    throw new Error("User is required to save data");
  }
  switch (system.getConfig<DataConfig>().data.sequelize.dialect) {
    case "postgres":
      const parent = options.transaction;
      if (!options.transaction) {
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
async function afterSave(options: { transaction: Transaction, immediate: boolean }, system: System) {

  // console.log("afterSave", options);
  if (options.immediate) {
    system.logger.debug("event log - committing transaction");
    await options.transaction?.commit();
  }
}


export default eventLogModule;