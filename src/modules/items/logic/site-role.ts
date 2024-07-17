import { ItemEvent } from '..';
import { SiteRole } from '../../../types/models/models/site-role';
import {
  createOptions,
  getContextFromOptions,
  getSystemFromContext,
} from '../../data';
import { DataContext, FindOptions } from '../../data/types';
import { SiteDoc, SiteRoleCacheDoc, SiteRoleDoc } from '../types';
import { createRoleItemsCache } from '../utils';

export async function beforeSiteRoleValidate(siteRole: SiteRole, options: FindOptions) {
  const context = getContextFromOptions(options);
  return updateSiteRoleCache(siteRole, context);
}

export async function updateSiteRoleCache(
  siteRole: SiteRole,
  context: DataContext,
) {
  const site = await siteRole.getSite(createOptions(context));
  const siteRoleDoc: SiteRoleDoc = siteRole.doc;
  const siteDoc: SiteDoc = site.doc;
  if (!siteRoleDoc?.items) {
    throw new Error('Invalid item permissions');
  }
  if (!siteDoc?.data) {
    throw new Error('Invalid site item data');
  }
  const newItemStore = await createRoleItemsCache(siteDoc, siteRoleDoc, context);

  const cacheDoc: SiteRoleCacheDoc = {
    ...siteRole.cacheDoc,
    // roleHash: role.docHash,
    siteHash: site.docHash,
    data: newItemStore,
  };
  const core = getSystemFromContext(context);
  siteRole.set("cacheDoc", await core.execute(
    ItemEvent.ProcessSiteRoleCacheDoc,
    cacheDoc,
    siteRole,
    context,
  ));
  return siteRole;
}
