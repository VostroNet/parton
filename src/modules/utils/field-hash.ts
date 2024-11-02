import objectHash from 'object-hash';
import { ValidationOptions } from "sequelize/lib/instance-validator";

import { System } from "../../system";
import { IModule } from "../../types/system";
import { DataModule } from "../data";
import { DataHookEvent, DataModelHookEvents } from "../data/hooks";
import { IDefinition } from '../data/types';

export interface IHashField {
  [key: string]: string
}
export interface IHashDefinition extends IDefinition {
  hashFields?: IHashField
}

export const fieldHashModule: DataModelHookEvents & IModule = {
  name: "core-field-hash",
  dependencies: ["data"],
  [DataHookEvent.BeforeValidate]: async (instance: any, options: ValidationOptions, modelName: string, system: System) => {
    const data = system.get<DataModule>("data");
    if (!data || !data.getDefinition) {
      throw new Error("Data module not initialised");
    }
    const definition = data.getDefinition<IHashDefinition>(modelName);
    if (!definition) {
      throw new Error(`Definition not found for ${modelName}`);
    }
    if (definition.hashFields) {
      const hashFields = definition.hashFields;
      Object.keys(hashFields).forEach((fieldName) => {
        const hashField = hashFields[fieldName];
        if (instance[fieldName]) {
          const hash = objectHash(instance[fieldName]);
          if (instance[hashField] !== hash) {
            instance[hashField] = hash;
          }
        }
      });
      return instance;
    }
  },
};