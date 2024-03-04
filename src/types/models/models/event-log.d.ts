 

import { DbOptions, Model } from '../data';

import { User } from './user';

export interface EventLogCreationAttributes {
  action?: string;
  changeset?: any;
  description?: string;
  model?: string | null;
  primaryKey?: number | null;
  source?: string;
  userId?: number | null;
}
export interface EventLogAttributes {
  action: string;
  changeset: any;
  createdAt: any;
  description: string;
  id: number;
  model: string | null;
  primaryKey: number | null;
  source: string;
  updatedAt: any;
  userId: number | null;
}

export class EventLog extends Model<
  EventLogAttributes,
  EventLogCreationAttributes
> {
  action: string;
  changeset: any;
  createdAt: any;
  description: string;
  id: number;
  model: string | null;
  primaryKey: number | null;
  source: string;
  updatedAt: any;
  userId: number | null;
  user?: User | null;
  createUser(item: User, options: DbOptions): Promise<User>;
  getUser(options: DbOptions): Promise<User>;
  setUser(item: User, options: DbOptions): Promise<void>;
}
