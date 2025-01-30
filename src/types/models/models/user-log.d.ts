/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface UserLogCreationAttributes {
  data?: any | null;
  operation?: string;
  row_id?: number;
  time?: Date | string;
  userId?: number;

}
export interface UserLogAttributes {
  data: any | null;
  operation: string;
  row_id: number;
  time: Date | string;
  userId: number;

}
export class UserLog extends Sequelize.Model<UserLogAttributes, UserLogCreationAttributes> {
  data: any | null;
  operation: string;
  row_id: number;
  time: Date | string;
  userId: number;



}

export type UserLogStatic = typeof UserLog;

 