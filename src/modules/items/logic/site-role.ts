import { ItemEvent } from '..';
import { getSystemFromContext } from '../../../system';
import { SiteRole } from '../../../types/models/models/site-role';
import {
  createOptions,
  getContextFromOptions,
} from '../../data';
import { DataContext, FindOptions } from '../../data/types';
import { SiteDoc, SiteRoleCacheDoc, SiteRoleDoc } from '../types';
import { createRoleItemsCache as createSiteRoleCache } from '../utils';

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
  const newItemStore = await createSiteRoleCache(siteDoc, siteRoleDoc, context);

  const cacheDoc: SiteRoleCacheDoc = {
    ...siteRole.cacheDoc,
    // roleHash: role.docHash,
    siteHash: site.docHash,
    data: newItemStore,
    rootPath: site.sitePath,
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
