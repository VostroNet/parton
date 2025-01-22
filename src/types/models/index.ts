import Sequelize, { Model, ModelStatic } from "sequelize";

import {AuthLogStatic} from "./models/auth-log";
import {ConfigStatic} from "./models/config";
import {ConfigLogStatic} from "./models/config-log";
import {RoleStatic} from "./models/role";
import {RoleLogStatic} from "./models/role-log";
import {SiteStatic} from "./models/site";
import {SiteLogStatic} from "./models/site-log";
import {SiteRoleStatic} from "./models/site-role";
import {SiteRoleLogStatic} from "./models/site-role-log";
import {UserStatic} from "./models/user";
import {UserAuthStatic} from "./models/user-auth";
import {UserAuthLogStatic} from "./models/user-auth-log";
import {UserLogStatic} from "./models/user-log";


export enum ModelNames {
  AuthLog = "AuthLog",
  Config = "Config",
  ConfigLog = "ConfigLog",
  Role = "Role",
  RoleLog = "RoleLog",
  Site = "Site",
  SiteLog = "SiteLog",
  SiteRole = "SiteRole",
  SiteRoleLog = "SiteRoleLog",
  User = "User",
  UserAuth = "UserAuth",
  UserAuthLog = "UserAuthLog",
  UserLog = "UserLog",

}


interface SConfig {
  // [key: string]: ModelStatic<Model<any, any>>; 
  [ModelNames.AuthLog]: AuthLogStatic;
  [ModelNames.Config]: ConfigStatic;
  [ModelNames.ConfigLog]: ConfigLogStatic;
  [ModelNames.Role]: RoleStatic;
  [ModelNames.RoleLog]: RoleLogStatic;
  [ModelNames.Site]: SiteStatic;
  [ModelNames.SiteLog]: SiteLogStatic;
  [ModelNames.SiteRole]: SiteRoleStatic;
  [ModelNames.SiteRoleLog]: SiteRoleLogStatic;
  [ModelNames.User]: UserStatic;
  [ModelNames.UserAuth]: UserAuthStatic;
  [ModelNames.UserAuthLog]: UserAuthLogStatic;
  [ModelNames.UserLog]: UserLogStatic;

}


export interface DatabaseContext extends Omit<Sequelize.Sequelize, 'models'> {
  models: SConfig
}
export default DatabaseContext;  

