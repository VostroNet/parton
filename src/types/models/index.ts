import Sequelize, { Model, ModelStatic } from "sequelize";

import {ConfigStatic} from "./models/config";
import {RoleStatic} from "./models/role";
import {SiteStatic} from "./models/site";
import {SiteRoleStatic} from "./models/site-role";
import {UserStatic} from "./models/user";
import {UserAuthStatic} from "./models/user-auth";


export enum ModelNames {
  Config = "Config",
  Role = "Role",
  Site = "Site",
  SiteRole = "SiteRole",
  User = "User",
  UserAuth = "UserAuth",

}


interface SConfig {
  // [key: string]: ModelStatic<Model<any, any>>; 
  [ModelNames.Config]: ConfigStatic;
  [ModelNames.Role]: RoleStatic;
  [ModelNames.Site]: SiteStatic;
  [ModelNames.SiteRole]: SiteRoleStatic;
  [ModelNames.User]: UserStatic;
  [ModelNames.UserAuth]: UserAuthStatic;

}


export interface DatabaseContext extends Omit<Sequelize.Sequelize, 'models'> {
  models: SConfig
}
export default DatabaseContext;  

