import { describe, expect, test } from '@jest/globals';
import { Op } from 'sequelize';

import { RoleModelPermissionLevel } from '../../../src/modules/core/types';
import { validateFindOptions } from '../../../src/modules/data/validation';

import { createFindOptions } from './utils';


describe('validate find options ', () => {
  test('testing if both doc and table has allowed read access', async () => {
    const roleDoc = {
      schema: {
        r: true,
        models: {
          tableName: {
            r: true,
          },
        },
      },
    };
    const findOptions = createFindOptions({id: "test"}, roleDoc , {
      where: {
        id: "test"
      }
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", () => {}, false);
    expect(result.valid).toBe(true);
    expect(result.where).toEqual({id: "test"});
  });
  test('if doc denies read access then deny read even if table allows read', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: false,
        models: {
          tableName: {
            r: true,
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", undefined, false);
    expect(result.valid).toBe(false);
    expect(result.where).toEqual({val: "1=0"});
  });

  test('doc allows read access but table denies access', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: true,
        models: {
          tableName: {
            r: false
          }
        }
      }
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", () => {}, false);
    expect(result.valid).toBe(false);
    expect(result.where).toEqual({val: "1=0"});
  });
  
  test('denyOnSelf is true and doc role is set to self', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            r: true
          }
        }
      }
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", () => {}, true);
    expect(result.valid).toBe(false);
    expect(result.where).toEqual({val: "1=0"});
  });
  test('denyOnSelf is set to true and doc allows but table is set to self', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: true,
        models: {
          tableName: {
            r: RoleModelPermissionLevel.self,
          },
        },
      },
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", undefined, true);
    expect(result.valid).toBe(false);
    expect(result.where).toEqual({val: "1=0"});
  });
  test('if self is provided on table read ensuring the default where filter is supplied', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: true,
        models: {
          tableName: {
            r: RoleModelPermissionLevel.self,
          },
        },
      },
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", undefined, false);
    expect(result.valid).toBe(true);
    expect(result.where).toEqual({whereKey: "test"});
    expect(result.originalWhere).toEqual(undefined);
    expect(result.context).toEqual(findOptions.context);
  });
  test('if self is provided on doc read ensuring the default where filter is supplied', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            r: true,
          },
        },
      },
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", undefined, false);
    // console.log(result)
    expect(result.valid).toBe(true);
    expect(result.where).toEqual({whereKey: "test"});
    expect(result.originalWhere).toEqual(undefined);
    expect(result.context).toEqual(findOptions.context);
  });
  test('if the same whereKey is provided to the find options', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            r: true,
          },
        },
      },
    }, {
      where: {
        whereKey: "test3"
      }
    });
    const result = await validateFindOptions("tableName", findOptions, "whereKey", undefined, false);
    // console.log(result)
    expect(result.valid).toBe(true);
    expect(result.where).toEqual({
      [Op.and]: [{"whereKey": "test3"}, {"whereKey": "test"}]
    });
    expect(result.originalWhere).toEqual([{"whereKey": "test3"}]);
    expect(result.context).toEqual(findOptions.context);
  });

  test('custom where key filter function supplied', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        r: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            r: true,
          },
        },
      },
    }, {
      where: {}
    });
    let u: any = undefined, rl: any = undefined;
    const result = await validateFindOptions("tableName", findOptions, "whereKey", (user, roleLevel) => {
      u = user;
      rl = roleLevel;
      return "test4";
    }, false);
    expect(u?.id).toBe("test");
    expect(rl).toBe(RoleModelPermissionLevel.self);
    expect(result.valid).toBe(true);
    expect(result.where).toEqual({whereKey: "test4"});
    expect(result.originalWhere).toEqual([{}]);
    expect(result.context).toEqual(findOptions.context);
  });
});