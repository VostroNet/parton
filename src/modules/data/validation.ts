// import { OKind, objVisit } from "@vostro/object-visit";
import Sequelize from 'sequelize';

import { Role } from '../../types/models/models/role';
import { User } from '../../types/models/models/user';
import { IUser, MutationType, RoleDoc, RoleModelPermissionLevel } from '../core/types';

import { DataContext, FindOptions } from './types';

function invalidateFindOptions(options: FindOptions) {
  options.valid = false;
  options.where = Sequelize.literal('1=0');
  return options;
}

export async function validateFindOptions(
  tableName: string,
  options: FindOptions,
  whereKey: any,
  whereFunc: (user: any, roleLevel: RoleModelPermissionLevel) => any = (
    user: any,
  ) => user.id,
  denyOnSelf = false,
  Op: typeof Sequelize.Op.and = Sequelize.Op.and,
) {
  const override = getOverrideFromOptions(options);
  if (override) {
    return options;
  }
  const role = getRoleFromOptions(options);
  if (!role) {
    // console.log("THROWING ERROR")
    // console.trace("THROWING ERROR");
    // console.profile()
    throw new Error('no role provided to validate find options');
  }

  const roleDoc = role.doc as RoleDoc;
  const schema = roleDoc.schema;
  if (!schema) {
    throw new Error('no schema found for role');
  }
  const tablePerms = schema?.models?.[tableName];
  if (!schema.r && !tablePerms?.r) {
    return invalidateFindOptions(options);
  }
  let roleLevel = RoleModelPermissionLevel.self;
  if (
    schema.r !== RoleModelPermissionLevel.self ||
    (tablePerms?.r === true || tablePerms?.r === RoleModelPermissionLevel.global)
  ) {
    roleLevel = RoleModelPermissionLevel.global;
  }

  if (roleLevel === RoleModelPermissionLevel.global) {
    options.valid = true;
    return options;
  }
  if (denyOnSelf && roleLevel === RoleModelPermissionLevel.self) {
    return invalidateFindOptions(options);
  }

  const user = await getUserFromOptions(options);
  const filter = {
    [whereKey]: await whereFunc(user, roleLevel),
  };

  // TODO: use object-visit to validate the where clause.

  if (options.where) {
    if (!options.originalWhere) {
      options.originalWhere = [];
    }
    options.originalWhere.push(Object.assign({}, options.where));
    if ((options.where as any)[whereKey]) {
      options.where = Object.assign({}, options.where, {
        [Op]: [
          {
            [whereKey]: (options.where as any)[whereKey],
          },
          filter,
        ],
      });
      delete (options.where as any)[whereKey];
    } else {
      options.where = Object.assign({}, options.where, filter);
    }
  } else {
    options.where = filter;
  }
  options.valid = true;
  return options;
}

// Fallback checker if hooks is added to the model to still check for the field permission.
export async function validateDirectUserKey<T>(
  user: IUser<T>,
  model: any,
  roleLevel: RoleModelPermissionLevel,
  context: DataContext,
  fieldCheck: any,
) {
  if (!fieldCheck) {
    return false;
  }
  return user.id === model.userId;
}

export async function validateMutation<T>(
  tableName: string,
  mutationType: MutationType,
  options: FindOptions,
  model: T,
  validateModel = validateDirectUserKey,
  denyOnSelf = false,
) {
  if (options.enforceInvalid && !options.valid) {
    return model;
  }
  if (getOverrideFromOptions(options)) {
    return model;
  }
  const context = getContextFromOptions(options);
  const role = getRoleFromOptions(options);
  if (!role) {
    throw new Error('no role provided to validate find options');
  }

  const roleDoc = role.doc as RoleDoc;
  const schema = roleDoc.schema;
  if (!schema) {
    throw new Error('no schema found for role');
  }
  const tablePerms = (schema.models || {})[tableName];
  let mutationKey:
    | {
      doc?: boolean | RoleModelPermissionLevel;
      table?: boolean | RoleModelPermissionLevel;
    }
    | undefined = undefined;
  switch (mutationType) {
    case MutationType.create:
      mutationKey = {
        doc: schema.w,
        table: tablePerms?.w,
      };
      break;
    case MutationType.update:
      mutationKey = {
        doc: schema.u,
        table: tablePerms?.u,
      };
      break;
    case MutationType.destroy:
      mutationKey = {
        doc: schema.d,
        table: tablePerms?.d,
      };
      break;
    default:
      throw new Error('invalid mutation type');
  }

  if (!mutationKey.doc && !mutationKey.table) {
    throw new Error('ENOPERMS');
  }
  let roleLevel = RoleModelPermissionLevel.self;
  if (
    (mutationKey.table === true ||
      mutationKey.table === RoleModelPermissionLevel.global) &&
    (mutationKey.doc === true ||
      mutationKey.doc === RoleModelPermissionLevel.global)
  ) {
    roleLevel = RoleModelPermissionLevel.global;
  }

  if (denyOnSelf && roleLevel === RoleModelPermissionLevel.self) {
    throw new Error('EDENYONSELF');
  }
  // if wildcard table perms, allow all
  if (!mutationKey.table && mutationKey.doc && !tablePerms?.f) {
    options.valid = true;
    options.validated = true;
    return model;
  }


  if (!tablePerms?.f) {
    throw new Error('ENOPERMFIELDS');
  }
  const fieldCheck = Object.keys((model as any)._changed).reduce(
    (valid: any, fieldName: string) => {
      if (!tablePerms?.f || !valid) {
        return false;
      }
      const fieldPerms = tablePerms.f[fieldName];
      if (!fieldPerms) {
        return false;
      }
      switch (mutationType) {
        case MutationType.create:
          if (fieldPerms.w) {
            return true;
          }
          break;
        case MutationType.update:
          if (fieldPerms.u) {
            return true;
          }
          break;
        case MutationType.destroy:
          if (fieldPerms.d) {
            return true;
          }
          break;
      }
      return false;
    },
    true,
  );

  if (!fieldCheck) {
    throw new Error('EFCFAILED');
  }
  if (roleLevel === RoleModelPermissionLevel.global) {
    options.valid = true;
    options.validated = true;
    return model;
  }

  const user = await getUserFromOptions<User>(options);
  if (!user) {
    throw new Error('no user provided to validate mutation options');
  }
  if (await validateModel(user, model, roleLevel, context, fieldCheck)) {
    options.valid = true;
    options.validated = true;
    return model;
  }
  throw new Error('EINVALIDMODEL');
}

export function getContextFromOptions(options: FindOptions): DataContext {
  let context = options.context || {};
  if (options.getGraphQLArgs) {
    context = options.getGraphQLArgs().context;
  } else if (context.getGraphQLArgs) {
    context = context.getGraphQLArgs().context;
  }
  return context;
}

export function getOverrideFromOptions(options: FindOptions = {}): boolean {
  const context = getContextFromOptions(options) || {};
  return (options.override || context.override) === true;
}
export function getRoleFromOptions(
  options: FindOptions = {},
): Role | undefined {
  const context = getContextFromOptions(options) || {};
  return context.role;
}
export async function getUserFromOptions<T>(
  options: FindOptions = {},
): Promise<IUser<T> | undefined> {
  const context = getContextFromOptions(options) || {};
  if (!context.getUser) {
    return undefined;
  }
  return context.getUser<T>();
}
