/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface SiteLogCreationAttributes {
  data?: any | null;
  operation?: string;
  rowId?: number;
  time?: Date | string;
  userId?: number;

}
export interface SiteLogAttributes {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;

}
export class SiteLog extends Sequelize.Model<SiteLogAttributes, SiteLogCreationAttributes> {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;



}

export type SiteLogStatic = typeof SiteLog;

 