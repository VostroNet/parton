/* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-empty-interface */

// import {DbOptions, Model} from "../data";
import Sequelize, {Model} from "sequelize";
import {SiteRole} from "./site-role";

export interface SiteCreationAttributes {
  default?: boolean;
  displayName?: string;
  doc?: any;
  docHash?: string;
  name?: string;
  sitePath?: string;

}
export interface SiteAttributes {
  createdAt: Date | string;
  default: boolean;
  displayName: string;
  doc: any;
  docHash: string;
  id: number;
  name: string;
  sitePath: string;
  updatedAt: Date | string;

}
export class Site extends Sequelize.Model<SiteAttributes, SiteCreationAttributes> {
  createdAt: Date | string;
  default: boolean;
  displayName: string;
  doc: any;
  docHash: string;
  id: number;
  name: string;
  sitePath: string;
  updatedAt: Date | string;
  siteRoles?: SiteRole[] | null;
  addSiteRole(item: SiteRole, options: DbOptions): Promise<SiteRole>;
  addSiteRoles(items: SiteRole[], options: DbOptions): Promise<SiteRole[]>;
  countSiteRoles(options: DbOptions): Promise<number>;
  createSiteRole(item: SiteRole, options: DbOptions): Promise<SiteRole>;
  getSiteRoles(options: DbOptions): Promise<SiteRole[]>;
  hasSiteRoles(items: SiteRole[], options: DbOptions): Promise<boolean>;
  hasSiteRole(item: SiteRole, options: DbOptions): Promise<boolean>;
  removeSiteRole(item: SiteRole, options: DbOptions): Promise<void>;
  removeSiteRoles(items: SiteRole[], options: DbOptions): Promise<void>;
  setSiteRoles(items: SiteRole[], options: DbOptions): Promise<void>;
  static getSiteByHostname(args: SiteGetSiteByHostnameArgs, context: DataContext): Promise<any>;

}

export type SiteStatic = typeof Site;

export interface SiteGetSiteByHostnameArgs { }
 