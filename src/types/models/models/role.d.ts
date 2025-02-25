/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {SiteRole} from "./site-role";
import {User} from "./user";

export interface RoleCreationAttributes {
  cacheDoc?: any;
  cacheDocHash?: string;
  doc?: any;
  docHash?: string;
  enabled?: boolean;
  name?: string;

}
export interface RoleAttributes {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: Date | string;
  doc: any;
  docHash: string;
  enabled: boolean;
  id: number;
  name: string;
  updatedAt: Date | string;

}
export class Role extends Sequelize.Model<RoleAttributes, RoleCreationAttributes> {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: Date | string;
  doc: any;
  docHash: string;
  enabled: boolean;
  id: number;
  name: string;
  updatedAt: Date | string;
  siteRoles?: SiteRole[] | null;
  users?: User[] | null;
  addSiteRole(item: SiteRole, options: DbOptions): Promise<SiteRole>;
  addSiteRoles(items: SiteRole[], options: DbOptions): Promise<SiteRole[]>;
  countSiteRoles(options: DbOptions): Promise<number>;
  createSiteRole(item: SiteRole, options: DbOptions): Promise<SiteRole>;
  getSiteRoles(options: DbOptions): Promise<SiteRole[]>;
  hasSiteRoles(items: SiteRole[], options: DbOptions): Promise<boolean>;
  hasSiteRole(item: SiteRole, options: DbOptions): Promise<boolean>;
  removeSiteRole(item: SiteRole, options: DbOptions): Promise<void>;
  removeSiteRoles(items: SiteRole[], options: DbOptions): Promise<void>;
  setSiteRoles(items: SiteRole[], options: DbOptions): Promise<void>;
  addUser(item: User, options: DbOptions): Promise<User>;
  addUsers(items: User[], options: DbOptions): Promise<User[]>;
  countUsers(options: DbOptions): Promise<number>;
  createUser(item: User, options: DbOptions): Promise<User>;
  getUsers(options: DbOptions): Promise<User[]>;
  hasUsers(items: User[], options: DbOptions): Promise<boolean>;
  hasUser(item: User, options: DbOptions): Promise<boolean>;
  removeUser(item: User, options: DbOptions): Promise<void>;
  removeUsers(items: User[], options: DbOptions): Promise<void>;
  setUsers(items: User[], options: DbOptions): Promise<void>;
  updateCache(args: RoleUpdateCacheArgs, context: DataContext): Promise<any>;

}

export type RoleStatic = typeof Role;

export interface RoleUpdateCacheArgs { }
 