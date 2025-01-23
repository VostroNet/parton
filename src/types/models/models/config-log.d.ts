/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface ConfigLogCreationAttributes {
  data?: any | null;
  operation?: string;
  rowId?: number;
  time?: Date | string;
  userId?: number;

}
export interface ConfigLogAttributes {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;

}
export class ConfigLog extends Sequelize.Model<ConfigLogAttributes, ConfigLogCreationAttributes> {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;



}

export type ConfigLogStatic = typeof ConfigLog;

 