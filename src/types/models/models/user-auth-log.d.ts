/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface UserAuthLogCreationAttributes {
  data?: any | null;
  operation?: string;
  rowId?: number;
  time?: Date | string;
  userId?: number;

}
export interface UserAuthLogAttributes {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;

}
export class UserAuthLog extends Sequelize.Model<UserAuthLogAttributes, UserAuthLogCreationAttributes> {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;



}

export type UserAuthLogStatic = typeof UserAuthLog;

 