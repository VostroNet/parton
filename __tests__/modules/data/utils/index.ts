import { RoleDoc } from "../../../../src/modules/core/types";
import { FindOptions } from "../../../../src/modules/data/types";

export function createFindOptions(user: any = {id: "test"}, roleDoc: RoleDoc, options: FindOptions = {}) : FindOptions {
  return {
    context: {
      getUser: () => user,
      role: {
        id: "test",
        doc: roleDoc
      } as any
    },
    ...options
  }
}
