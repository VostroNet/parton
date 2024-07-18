import { createContext, System } from "../../system";
import {  IModule } from "../../types/system";
import waterfall from "../../utils/waterfall";
import { CoreConfig } from "../core/types";
import { createOptions, DataEvent, DataEvents, getDatabase } from "../data";

export const roleUpsertModule: DataEvents & IModule = {
  name: "core-role-upsert",
  dependencies: ["core"],
  [DataEvent.Setup]: async (system: System) => {
    const cfg = system.getConfig<CoreConfig>();
    const roles = cfg?.roles || {};

    const context = await createContext(system, undefined,  undefined, true);
    await waterfall(Object.keys(roles || {}), async (roleName: string) => {
      
      const roleSchema = roles[roleName];

      const db = await getDatabase(system);
      const { Role } = db.models;

      const role = await Role.findOne(createOptions(context, {
        where: {
          name: roleName,
        },
      }));
      if (!role) {
        system.logger.debug('Creating role', roleName);
        await Role.create(
          {
            name: roleName,
            doc: roleSchema,
            // default: roleSchema.default,
          },
          createOptions(context),
        );
      } else {
        system.logger.debug('Updating role', roleName);
        await role.update(
          {
            doc: roleSchema,
            // default: roleSchema.default,
          },
          createOptions(context),
        );
      }
    });
  },
};