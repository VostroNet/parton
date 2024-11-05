import { IDefinition } from '../types';

import Config from './config';
// import EventLog from './event-log';
import Role from './role';
import Site from './site';
import SiteRole from './site-role';
import User from './user';
import UserAuth from './user-auth';

const models: { [key: string]: IDefinition } = {
  Site,
  SiteRole,
  User,
  Config,
  // EventLog,
  Role,
  UserAuth,
};
export default models;
