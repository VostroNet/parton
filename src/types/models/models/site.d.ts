/* eslint-disable @typescript-eslint/no-unused-vars */

import {DbOptions, Model} from "../data";

import {SiteRole} from "./site-role";

export interface SiteCreationAttributes {
  default?: any;
  displayName?: string;
  doc?: any;
  docHash?: string;
  hostnames?: any;
  name?: string;
  sitePath?: string;

}
export interface SiteAttributes {
  createdAt: any;
  default: any;
  displayName: string;
  doc: any;
  docHash: string;
  hostnames: any;
  id: number;
  name: string;
  sitePath: string;
  updatedAt: any;

}

export class Site extends Model<SiteAttributes, SiteCreationAttributes> {
  createdAt: any;
  default: any;
  displayName: string;
  doc: any;
  docHash: string;
  hostnames: any;
  id: number;
  name: string;
  sitePath: string;
  updatedAt: any;
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

}
