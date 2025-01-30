/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface RoleLogCreationAttributes {
  data?: any | null;
  operation?: string;
  row_id?: number;
  time?: Date | string;
  userId?: number;

}
export interface RoleLogAttributes {
  data: any | null;
  operation: string;
  row_id: number;
  time: Date | string;
  userId: number;

}
export class RoleLog extends Sequelize.Model<RoleLogAttributes, RoleLogCreationAttributes> {
  data: any | null;
  operation: string;
  row_id: number;
  time: Date | string;
  userId: number;



}

export type RoleLogStatic = typeof RoleLog;

 