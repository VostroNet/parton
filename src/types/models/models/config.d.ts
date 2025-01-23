/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface ConfigCreationAttributes {
  config?: any;
  type?: string;

}
export interface ConfigAttributes {
  config: any;
  createdAt: Date | string;
  id: number;
  type: string;
  updatedAt: Date | string;

}
export class Config extends Sequelize.Model<ConfigAttributes, ConfigCreationAttributes> {
  config: any;
  createdAt: Date | string;
  id: number;
  type: string;
  updatedAt: Date | string;



}

export type ConfigStatic = typeof Config;

 