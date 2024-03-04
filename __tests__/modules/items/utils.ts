import { DataEvent, DataEvents } from "../../../src/modules/data";
import { upsertSiteFromImportSite } from "../../../src/modules/items/logic/site";
import { ImportSite } from "../../../src/modules/items/types";
import { createContext, System } from "../../../src/system";
import { IModule } from "../../../src/types/system";

export function createSiteSetupModule(importSite: ImportSite<any>) {
  const moduleTest: IModule & DataEvents = {
    name: 'import-site',
    dependencies: [{
      event: DataEvent.Setup,
      required: {
        after: ["core-role-upsert", "core-field-hash"]
      }
    }],
    [DataEvent.Setup]: async (core: System) => {
      const context = await createContext(core, undefined, "system", true);
      await upsertSiteFromImportSite(importSite, context);
    }
  };
  return moduleTest;
}