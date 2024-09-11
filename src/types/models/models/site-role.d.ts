/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

import {DbOptions, Model} from "../data";

import {Role} from "./role";
import {Site} from "./site";

export interface SiteRoleCreationAttributes {
  cacheDoc?: any;
  cacheDocHash?: string;
  default?: any;
  doc?: any;
  docHash?: string;
  roleId?: number | null;
  siteId?: number | null;

}
export interface SiteRoleAttributes {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: any;
  default: any;
  doc: any;
  docHash: string;
  id: number;
  roleId: number | null;
  siteId: number | null;
  updatedAt: any;

}

export class SiteRole extends Model<SiteRoleAttributes, SiteRoleCreationAttributes> {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: any;
  default: any;
  doc: any;
  docHash: string;
  id: number;
  roleId: number | null;
  siteId: number | null;
  updatedAt: any;
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
export interface SiteRoleUpdateCacheArgs { }
 