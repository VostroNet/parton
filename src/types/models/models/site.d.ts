/* eslint-disable @typescript-eslint/no-unused-vars */

import {DbOptions, Model} from "../data";

import {Role} from "./role";

export interface SiteCreationAttributes {
  default?: any;
  displayName?: string;
  doc?: any;
  docHash?: string;
  name?: string;

}
export interface SiteAttributes {
  createdAt: any;
  default: any;
  displayName: string;
  doc: any;
  docHash: string;
  id: number;
  name: string;
  updatedAt: any;

}

export class Site extends Model<SiteAttributes, SiteCreationAttributes> {
  createdAt: any;
  default: any;
  displayName: string;
  doc: any;
  docHash: string;
  id: number;
  name: string;
  updatedAt: any;
  roles?: Role[] | null;
  addRole(item: Role, options: DbOptions): Promise<Role>;
  addRoles(items: Role[], options: DbOptions): Promise<Role[]>;
  countRoles(options: DbOptions): Promise<number>;
  createRole(item: Role, options: DbOptions): Promise<Role>;
  getRoles(options: DbOptions): Promise<Role[]>;
  hasRoles(items: Role[], options: DbOptions): Promise<boolean>;
  hasRole(item: Role, options: DbOptions): Promise<boolean>;
  removeRole(item: Role, options: DbOptions): Promise<void>;
  removeRoles(items: Role[], options: DbOptions): Promise<void>;
  setRoles(items: Role[], options: DbOptions): Promise<void>;

}
