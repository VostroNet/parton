/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface SiteRoleLogCreationAttributes {
  data?: any | null;
  operation?: string;
  rowId?: number;
  time?: Date | string;
  userId?: number;

}
export interface SiteRoleLogAttributes {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;

}
export class SiteRoleLog extends Sequelize.Model<SiteRoleLogAttributes, SiteRoleLogCreationAttributes> {
  data: any | null;
  operation: string;
  rowId: number;
  time: Date | string;
  userId: number;



}

export type SiteRoleLogStatic = typeof SiteRoleLog;

 