/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

import {DbOptions, Model} from "../data";

import {Site} from "./site";
import {User} from "./user";

export interface RoleCreationAttributes {
  cacheDoc?: any;
  cacheDocHash?: string;
  default?: any;
  doc?: any;
  docHash?: string;
  enabled?: any;
  name?: string;
  siteId?: number | null;

}
export interface RoleAttributes {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: any;
  default: any;
  doc: any;
  docHash: string;
  enabled: any;
  id: number;
  name: string;
  siteId: number | null;
  updatedAt: any;

}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> {
  cacheDoc: any;
  cacheDocHash: string;
  createdAt: any;
  default: any;
  doc: any;
  docHash: string;
  enabled: any;
  id: number;
  name: string;
  siteId: number | null;
  updatedAt: any;
  site?: Site | null;
  users?: User[] | null;
  createSite(item: Site, options: DbOptions): Promise<Site>;
  getSite(options: DbOptions): Promise<Site>;
  setSite(item: Site, options: DbOptions): Promise<void>;
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
export interface RoleUpdateCacheArgs { }
