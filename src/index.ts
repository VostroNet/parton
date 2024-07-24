
import cliModule from "./modules/cli";
import coreModule from "./modules/core";
import dataModule from "./modules/data";
import expressModule from "./modules/express";
import gqljdtModule from "./modules/gqljdt";
import httpModule from "./modules/http";
import itemModule from "./modules/items";
import { fieldHashModule } from "./modules/utils/field-hash";
import { roleUpsertModule } from "./modules/utils/role-upsert";
import yogaModule from "./modules/yoga";
import { System as system } from "./system";


export const System = system;
export const Modules = {
  Core: coreModule,
  FieldHash: fieldHashModule,
  RoleUpsert: roleUpsertModule,
  Data: dataModule,
  Items: itemModule,
  Http: httpModule,
  Express: expressModule,
  GqlJdt: gqljdtModule,
  Yoga: yogaModule,
  Cli: cliModule
}
export const defaultModules = [
  coreModule,
  fieldHashModule,
  roleUpsertModule,
  dataModule,
  itemModule,
  httpModule,
  expressModule,
  gqljdtModule,
  yogaModule
];

export default system;