/* eslint-disable @typescript-eslint/no-unused-vars */
  
// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";

export interface ConfigCreationAttributes {
  config?: any;
  type?: string;

}
export interface ConfigAttributes {
  config: any;
  createdAt: any;
  id: number;
  type: string;
  updatedAt: any;

}
export class Config extends Sequelize.Model<ConfigAttributes, ConfigCreationAttributes> {
  config: any;
  createdAt: any;
  id: number;
  type: string;
  updatedAt: any;



}

export type ConfigStatic = typeof Config;

 