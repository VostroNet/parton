import { IDefinition } from '../../core/types';

import Role from './role';
import Site from './site';
import SiteRole from './site-role';

const models: { [key: string]: IDefinition } = {
  Role,
  Site,
  SiteRole,
};
export default models;
