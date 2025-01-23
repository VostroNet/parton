/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {User} from "./user";

export interface AuthLogCreationAttributes {
  ipAddress?: any | null;
  operation?: string;
  time?: Date | string;
  type?: string;
  userId?: number | null;

}
export interface AuthLogAttributes {
  createdAt: Date | string;
  id: number;
  ipAddress: any | null;
  operation: string;
  time: Date | string;
  type: string;
  updatedAt: Date | string;
  userId: number | null;

}
export class AuthLog extends Sequelize.Model<AuthLogAttributes, AuthLogCreationAttributes> {
  createdAt: Date | string;
  id: number;
  ipAddress: any | null;
  operation: string;
  time: Date | string;
  type: string;
  updatedAt: Date | string;
  userId: number | null;
  user?: User | null;
  createUser(item: User, options: DbOptions): Promise<User>;
  getUser(options: DbOptions): Promise<User>;
  setUser(item: User, options: DbOptions): Promise<void>;

}

export type AuthLogStatic = typeof AuthLog;

 