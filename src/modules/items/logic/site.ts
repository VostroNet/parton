import path from 'path';

import { Site } from '../../../types/models/models/site';
import { readJSONFile } from '../../../utils/fs';
import waterfall from '../../../utils/waterfall';
import {
  createOptions,
  getContextFromOptions,
  getDatabaseFromContext,
} from '../../data';
import { DataContext, FindOptions } from '../../data/types';
import { ImportSite } from '../types';
import { createItemDataFromImportItems } from '../utils';

// import { updateRoleSiteCache } from "./role-site";

// export async function afterSiteCreate(site: Site, options: FindOptions) {
//   const db = await getDatabaseFromOptions(options);
//   const context = getContextFromOptions(options);
//   const {RoleSite, Role} = db.models;
//   const roles = await site.getRoles(createOptions(context));
//   await waterfall(roles, async (role) => {

//     const roleSite = await RoleSite.build({
//       roleId: role.id,
//       siteId: site.id,
//     }, createOptions(context));
//     await updateRoleSiteCache(roleSite, context);
//     return roleSite.save(createOptions(context));
//   });
// }

export async function afterSiteUpdate(site: Site, options: FindOptions) {
  // const db = await getDatabaseFromOptions(options);
  const context = getContextFromOptions(options);
  if (site.changed('docHash')) {
    const roles = await site.getRoles(createOptions(context));
    await waterfall(roles, async (role) => {
      await role.updateCache({}, context);
      return role.save(createOptions(context));
    });
  }
}

export async function upsertSiteFromImportSite(
  importSite: ImportSite<any>,
  context: DataContext,
  cwd = process.cwd(),
): Promise<Site> {
  const db = await getDatabaseFromContext(context);
  const { Site } = db.models;

  const itemsData = await createItemDataFromImportItems(importSite.items, cwd);
  let site = await Site.findOne(
    createOptions(context, {
      where: {
        name: importSite.name,
      },
    }),
  );

  if (!site) {
    site = await Site.create(
      {
        ...importSite,
        doc: {
          data: itemsData,
        },
      },
      createOptions(context),
    );
  } else {
    await site.update(
      {
        ...importSite,
        doc: {
          ...site.doc,
          data: itemsData,
        },
      },
      createOptions(context),
    );
  }
  return site;
}

export async function upsertSiteFromFile(
  filePath: string,
  context: DataContext,
): Promise<Site> {
  const importFile = await readJSONFile<ImportSite<any>>(filePath);
  if (!importFile?.items) {
    throw new Error('Invalid import file');
  }
  const cwd = path.dirname(filePath);

  return upsertSiteFromImportSite(importFile, context, cwd);
}
