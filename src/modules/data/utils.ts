import { System } from "../../system";
import { RoleDoc } from "../core/types";

import { DataModule } from ".";

import { createSchema } from '@vostro/gqlize';
import GQLManager from '@vostro/gqlize/lib/manager';
import { IDefinition } from "./types";

export function getDefinition<T extends IDefinition>(name: string, system: System): T {
  const data = system.get<DataModule>("data");
  if (!data || !data.getDefinition) {
    // eslint-disable-next-line functional/no-throw-statements
    throw new Error("Data module not initialised");
  }
  return data.getDefinition<T>(name);
}



export async function buildSchemaFromDatabase(
  _: System,
  roleDoc: RoleDoc,
  gqlManager: GQLManager,
) {
  if (!roleDoc) {
    throw new Error('no role schema provided');
  }
  const roleSchema = roleDoc.schema || {};
  if (!roleSchema) {
    throw new Error('no role schema provided');
  }

  const permissionFunc = {
    model(modelName: string | number) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (roleSchema.models) {
        if (roleSchema.models.w || roleSchema.models.r) {
          return true;
        }
        const m = roleSchema.models[modelName];
        if (m?.w || m?.r) {
          return true;
        }
      }
      return false;
    },
    field(modelName: any, fieldName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (roleSchema.models) {
        if (roleSchema.models.w || roleSchema.models.r) {
          return true;
        }
        const m = roleSchema.models[modelName];
        if (m?.w || m?.r) {
          return true;
        }
        if (m?.f) {
          const fp = m.f[fieldName];
          if (fp?.w || fp?.r) {
            return true;
          }
        }
      }
      return false;
    },
    relationship(modelName: any, relationshipName: any, targetModelName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w || roleSchema.models.r) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[relationshipName];
        if ((fp?.w || fp?.r) && roleSchema.models[targetModelName]) {
          return true;
        }
      }
      return false;
    },
    query(modelName: string | number) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }
      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w || roleSchema.models.r) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      return false;
    },
    queryClassMethods(modelName: any, methodName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w || roleSchema.models.r) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.cm) {
        const fp = m.cm[methodName];
        if (fp?.w || fp?.r) {
          return true;
        }
      }
      return false;
    },
    queryInstanceMethods(modelName: any, methodName: any) {
      if (roleSchema.w || roleSchema.r) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }

      if (roleSchema.models.w || roleSchema.models.r) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.r) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[methodName];
        if (fp?.w || fp?.r) {
          return true;
        }
      }
      return false;
    },
    mutation(modelName: string | number) {
      if (roleSchema.w || roleSchema.d || roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w || roleSchema.models.d || roleSchema.models.u) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w || m?.d || m.u) {
        return true;
      }
      return false;
    },
    mutationUpdate(modelName: any) {
      if (roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.u) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.u) {
        return true;
      }
      return false;
    },
    mutationUpdateInput(modelName: any, fieldName: any) {
      if (roleSchema.u) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.u) {
        return true;
      }
      const m = roleSchema.models[modelName];

      if (m?.u) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[fieldName];
        if (fp?.u) {
          return true;
        }
      }
      return false;
    },
    mutationCreate(modelName: any) {
      if (roleSchema.w) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w) {
        return true;
      }
      return false;
    },
    mutationCreateInput(modelName: any, fieldName: any) {
      if (roleSchema.w) {
        return true;
      }
      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.w) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.w) {
        return true;
      }
      if (m?.f) {
        const fp = m.f[fieldName];
        if (fp?.w) {
          return true;
        }
      }
      return false;
    },
    mutationDelete(modelName: any) {
      if (roleSchema.d) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      if (roleSchema.models.d) {
        return true;
      }
      const m = roleSchema.models[modelName];
      if (m?.d) {
        return true;
      }
      return false;
    },
    mutationClassMethods(modelName: any, methodName: any) {
      if (roleSchema.d) {
        return true;
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.w) {
        return true;
      }
      if (m?.cm) {
        const fp = m.cm[methodName];
        if (fp?.w) {
          return true;
        }
      }
      return false;
    },
    subscription(modelName: any, hookName: any) {
      if (roleSchema.s) {
        if (roleSchema.s[hookName]) {
          return true;
        }
      }

      if (!roleSchema.models) {
        return false;
      }
      const m = roleSchema.models[modelName];
      if (m?.s && m?.s[hookName]) {
        return true;
      }
      return false;
    },
    mutationExtension(modelName: any) {
      if (roleSchema.ext) {
        const ext = roleSchema.ext[modelName];
        if (ext?.w || ext?.d || ext?.u) {
          return true;
        }
      }
      return false;
    },
    queryExtension(modelName: any) {
      if (roleSchema.ext) {
        const ext = roleSchema.ext[modelName];
        if (ext?.w || ext?.r || ext?.u) {
          return true;
        }
      }
      return false;
    },
  };
  try {
    const schema = await createSchema(gqlManager, {
      permission: permissionFunc,
      // ...schemaConfig,
    });
    return schema;
  } catch (e) {
    console.error(e);
    throw e;
  }

}