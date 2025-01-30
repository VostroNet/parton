/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {Role} from "./role";
import {Site} from "./site";

export interface SiteRoleCreationAttributes {
  cacheDoc?: any;
  cacheDocHash?: string;
  default?: boolean;
  doc?: any;
  docHash?: string;
  roleId?: number;
  siteId?: number;

}
export interface SiteRoleAttributes {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: Date | string;
  default: boolean;
  doc: any;
  docHash: string;
  roleId: number;
  siteId: number;
  updatedAt: Date | string;

}
export class SiteRole extends Sequelize.Model<SiteRoleAttributes, SiteRoleCreationAttributes> {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: Date | string;
  default: boolean;
  doc: any;
  docHash: string;
  roleId: number;
  siteId: number;
  updatedAt: Date | string;
  role?: Role | null;
  site?: Site | null;
  createRole(item: Role, options: DbOptions): Promise<Role>;
  getRole(options: DbOptions): Promise<Role>;
  setRole(item: Role, options: DbOptions): Promise<void>;
  createSite(item: Site, options: DbOptions): Promise<Site>;
  getSite(options: DbOptions): Promise<Site>;
  setSite(item: Site, options: DbOptions): Promise<void>;
  updateCache(args: SiteRoleUpdateCacheArgs, context: DataContext): Promise<any>;

}

export type SiteRoleStatic = typeof SiteRole;

export interface SiteRoleUpdateCacheArgs { }
 