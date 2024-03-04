/* eslint-disable @typescript-eslint/no-unused-vars */

import {DbOptions, Model} from "../data";

import {Role} from "./role";
import {UserAuth} from "./user-auth";

export interface UserCreationAttributes {
  disabled?: any;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: number | null;
  userName?: string;

}
export interface UserAttributes {
  createdAt: any;
  disabled: any;
  email: string | null;
  firstName: string | null;
  id: number;
  lastName: string | null;
  roleId: number | null;
  updatedAt: any;
  userName: string;

}

export class User extends Model<UserAttributes, UserCreationAttributes> {
  createdAt: any;
  disabled: any;
  email: string | null;
  firstName: string | null;
  id: number;
  lastName: string | null;
  roleId: number | null;
  updatedAt: any;
  userName: string;
  auths?: UserAuth[] | null;
  role?: Role | null;
  addAuth(item: UserAuth, options: DbOptions): Promise<UserAuth>;
  addAuths(items: UserAuth[], options: DbOptions): Promise<UserAuth[]>;
  countAuths(options: DbOptions): Promise<number>;
  createAuth(item: UserAuth, options: DbOptions): Promise<UserAuth>;
  getAuths(options: DbOptions): Promise<UserAuth[]>;
  hasAuths(items: UserAuth[], options: DbOptions): Promise<boolean>;
  hasAuth(item: UserAuth, options: DbOptions): Promise<boolean>;
  removeAuth(item: UserAuth, options: DbOptions): Promise<void>;
  removeAuths(items: UserAuth[], options: DbOptions): Promise<void>;
  setAuths(items: UserAuth[], options: DbOptions): Promise<void>;
  createRole(item: Role, options: DbOptions): Promise<Role>;
  getRole(options: DbOptions): Promise<Role>;
  setRole(item: Role, options: DbOptions): Promise<void>;

}
