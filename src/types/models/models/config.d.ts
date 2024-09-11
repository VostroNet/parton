/* eslint-disable @typescript-eslint/no-unused-vars */
  
import {DbOptions, Model} from "../data";


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

export class Config extends Model<ConfigAttributes, ConfigCreationAttributes> {
  config: any;
  createdAt: any;
  id: number;
  type: string;
  updatedAt: any;



}
 