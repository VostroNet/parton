import { ItemEvent } from '..';
import { Role } from '../../../types/models/models/role';
import { Site } from '../../../types/models/models/site';
import {
  createOptions,
  getContextFromOptions,
  getDatabaseFromOptions,
  getSystemFromContext,
} from '../../data';
import { DataContext, FindOptions } from '../../data/types';
import { RoleCacheDoc, RoleItemDoc, SiteDoc } from '../types';
import { createRoleItemsCache } from '../utils';

export async function beforeRoleValidate(role: Role, options: FindOptions) {
  const db = await getDatabaseFromOptions(options);
  const context = getContextFromOptions(options);

  const { Site } = db.models;
  let site;
  if (!role.siteId) {
    site = await Site.findOne(
      createOptions(context, {
        where: {
          default: true,
        },
      }),
    );
    if (!site) {
      const core = getSystemFromContext(context);
      core.logger.warn(
        'No default site found for role - will not create cache',
        role.name,
      );
      return role;
    }
    role.siteId = site.id;
  } else {
    site = await Site.findOne(
      createOptions(context, {
        where: {
          id: role.siteId,
        },
      }),
    );
  }
  return updateRoleCache(role, site, context);
}

export async function updateRoleCache(
  role: Role,
  site: Site,
  context: DataContext,
) {
  const roleDoc: RoleItemDoc = role.doc;
  const siteDoc: SiteDoc = site.doc;
  if (!roleDoc?.items) {
    throw new Error('Invalid item permissions');
  }
  if (!siteDoc?.data) {
    throw new Error('Invalid site item data');
  }
  const newItemStore = await createRoleItemsCache(siteDoc, roleDoc, context);

  const cacheDoc: RoleCacheDoc = {
    ...role.cacheDoc,
    // roleHash: role.docHash,
    siteHash: site.docHash,
    data: newItemStore,
  };
  const core = getSystemFromContext(context);
  role.cacheDoc = await core.execute(
    ItemEvent.ProcessRoleCacheDoc,
    cacheDoc,
    role,
    site,
    context,
  );
  return role;
}

// export async function afterRoleCreate(role: Role, options: FindOptions) {
//   const db = await getDatabaseFromOptions(options);
//   const context = getContextFromOptions(options);
//   const {RoleSite, Site} = db.models;
//   const sites = await Site.findAll(createOptions(context));
//   await waterfall(sites, async (site) => {
//     const roleSite = await RoleSite.build({
//       roleId: role.id,
//       siteId: site.id,
//     }, createOptions(context));
//     await updateRoleSiteCache(roleSite, context);
//     return roleSite.save(createOptions(context));
//   });
// }

// export async function afterRoleUpdate(role: Role, options: FindOptions) {
//   const db = await getDatabaseFromOptions(options);
//   const context = getContextFromOptions(options);
//   const {RoleSite} = db.models;
//   if (role.changed("docHash")) {
//     const roleSites = await RoleSite.findAll(createOptions(context, {where: {roleId: role.id}}));
//     await waterfall(roleSites, async (roleSite) => {
//       await updateRoleSiteCache(roleSite, context);
//       return roleSite.save(createOptions(context));
//     });
//   }
//   // do something
// }
