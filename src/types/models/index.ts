import Sequelize, { Model, ModelStatic } from "sequelize";

import type {Config} from "./models/config";
import type {Role} from "./models/role";
import type {Site} from "./models/site";
import type {User} from "./models/user";
import type {UserAuth} from "./models/user-auth";


export enum ModelNames {
  Config = "Config",
  Role = "Role",
  Site = "Site",
  User = "User",
  UserAuth = "UserAuth",

}


export interface Models {
  [key: string]: ModelStatic<Model<any, any>>; 
  Config: typeof Config;
  Role: typeof Role;
  Site: typeof Site;
  User: typeof User;
  UserAuth: typeof UserAuth;
}


export default class DatabaseContext extends Sequelize.Sequelize {
  declare models: Models
}
