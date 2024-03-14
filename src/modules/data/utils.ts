import { System } from "../../system";
import { IDefinition } from "../core/types";

import { DataModule } from ".";


export function getDefinition<T extends IDefinition>(name: string, system: System): T {
  const data = system.get<DataModule>("data");
  if (!data || !data.getDefinition) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error("Data module not initialised");
  }
  return data.getDefinition<T>(name);
}