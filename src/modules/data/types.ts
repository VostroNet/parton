import { Sequelize, FindOptions as SFindOptions, Transaction, WhereOptions } from 'sequelize';
import { Definition, DefinitionOptions } from '@azerothian/gqlize/lib/types';

import { System } from "../../system";
import { Role } from "../../types/models/models/role";
// import { User } from "../../types/models/models/user";
import { Site } from '../../types/models/models/site';
import { IUser } from '../core/types';

// export interface IMigration {
//   name: string,
//   up: (args: MigratorArgs) => Promise<void>,
//   down: (args: MigratorArgs) => Promise<void>,
//   dependencies?: string[]

// }


export interface DataContext {
  system?: System;
  role?: Role | undefined;
  site?: Site | undefined;
  override?: boolean;
  getUser?: <T>() => Promise<IUser<T> | undefined>;
  // getRequest?: () => {req: Request , res: Response};/
  logout?: () => void;
  login?: (user: any) => void;
  // permissions?: Permissions
  getGraphQLArgs?: () => { args: any; context: any };
  disableEventLog?: boolean;
  transaction?: Transaction;
}

export interface FindOptions extends SFindOptions {
  overrideHooks?: boolean;
  hooks?: boolean;
  ignore?: boolean; // ??
  doNotUpdateCache?: boolean;
  override?: boolean;
  context?: DataContext;
  valid?: boolean;
  validated?: boolean;
  originalWhere?: WhereOptions[];
  getGraphQLArgs?: () => { args: any; context: any };
  enforceInvalid?: boolean;
  stripTransaction?: boolean;
  transaction?: Transaction;
  disableEventLog?: boolean;
  conflictFields?: string[];
}

export interface IDefinition extends Definition {
  disablePrimaryKey?: boolean;
  disableEventLog?: boolean;
  options?: DefinitionOptions & {
    timestamps?: boolean;
    tableName?: string;
    indexes?: any[];
  };
}