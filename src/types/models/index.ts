import Sequelize, { Model, ModelStatic } from "sequelize";

import {Config} from "./models/config";
import {Role} from "./models/role";
import {Site} from "./models/site";
import {SiteRole} from "./models/site-role";
import {User} from "./models/user";
import {UserAuth} from "./models/user-auth";


export enum ModelNames {
  Config = "Config",
  Role = "Role",
  Site = "Site",
  SiteRole = "SiteRole",
  User = "User",
  UserAuth = "UserAuth",

}


interface SConfig {
  [key: string]: ModelStatic<Model<any, any>>; 
  [ModelNames.Config]: typeof Config;
  [ModelNames.Role]: typeof Role;
  [ModelNames.Site]: typeof Site;
  [ModelNames.SiteRole]: typeof SiteRole;
  [ModelNames.User]: typeof User;
  [ModelNames.UserAuth]: typeof UserAuth;

}


export default class DatabaseContext extends Sequelize.Sequelize {
  declare models: SConfig
}
