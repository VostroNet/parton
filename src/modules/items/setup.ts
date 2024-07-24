
import { IModule } from "../../types/system";
import { DataEvent, DataEvents } from "../data";
import { ImportSite } from "./types";
import waterfall from "../../utils/waterfall";
import { upsertSiteFromImportSite } from "./logic/site";
import { createContext, System } from "../../system";


export function createSiteSetupModule(importSites: ImportSite<any>[]) {
  const moduleTest: IModule & DataEvents = {
    name: 'import-site',
    dependencies: [{
      event: DataEvent.Setup,
      required: {
        before: ["core-role-upsert", "core-field-hash"]
      }
    }],
    [DataEvent.Setup]: async (core: System) => {
      const context = await createContext(core, undefined, undefined, undefined, true);
      await waterfall(importSites, async (importSite) => {
        return upsertSiteFromImportSite(importSite, context);
      });
    }
  };
  return moduleTest;
}
