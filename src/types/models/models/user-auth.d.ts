/* eslint-disable @typescript-eslint/no-unused-vars */

import {DbOptions, Model} from "../data";

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

export class UserAuth extends Model<UserAuthAttributes, UserAuthCreationAttributes> {
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

}
