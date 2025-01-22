/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {Role} from "./role";
import {UserAuth} from "./user-auth";

export interface UserCreationAttributes {
  disabled?: boolean;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: number | null;
  userName?: string;

}
export interface UserAttributes {
  createdAt: Date | string;
  disabled: boolean;
  email: string | null;
  firstName: string | null;
  id: number;
  lastName: string | null;
  roleId: number | null;
  updatedAt: Date | string;
  userName: string;

}
export class User extends Sequelize.Model<UserAttributes, UserCreationAttributes> {
  createdAt: Date | string;
  disabled: boolean;
  email: string | null;
  firstName: string | null;
  id: number;
  lastName: string | null;
  roleId: number | null;
  updatedAt: Date | string;
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
  jwtToken(args: UserJwtTokenArgs, context: DataContext): Promise<any>;
  static getCurrentUser(args: UserGetCurrentUserArgs, context: DataContext): Promise<any>;
  static isLoggedIn(args: UserIsLoggedInArgs, context: DataContext): Promise<any>;

}

export type UserStatic = typeof User;

export interface UserJwtTokenArgs { }
export interface UserGetCurrentUserArgs { }
export interface UserIsLoggedInArgs { }
 