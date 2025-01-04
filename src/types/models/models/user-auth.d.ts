/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {User} from "./user";

export interface UserAuthCreationAttributes {
  name?: string | null;
  token?: string;
  type?: string;
  userId?: number | null;

}
export interface UserAuthAttributes {
  createdAt: any;
  id: number;
  name: string | null;
  token: string;
  type: string;
  updatedAt: any;
  userId: number | null;

}
export class UserAuth extends Sequelize.Model<UserAuthAttributes, UserAuthCreationAttributes> {
  createdAt: any;
  id: number;
  name: string | null;
  token: string;
  type: string;
  updatedAt: any;
  userId: number | null;
  user?: User | null;
  createUser(item: User, options: DbOptions): Promise<User>;
  getUser(options: DbOptions): Promise<User>;
  setUser(item: User, options: DbOptions): Promise<void>;
  static loginWithUsernamePassword(args: UserAuthLoginWithUsernamePasswordArgs, context: DataContext): Promise<any>;

}

export type UserAuthStatic = typeof UserAuth;

export interface UserAuthLoginWithUsernamePasswordArgs { }
 