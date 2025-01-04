import { IDefinition } from '../types';

import Config from './config';
// import EventLog from './event-log';
import Role from './role';
import Site from './site';
import SiteRole from './site-role';
import User from './user';

const models: { [key: string]: IDefinition } = {
  Site,
  SiteRole,
  User,
  Config,
  // EventLog,
  Role,
};
export default models;
