import { describe, expect, test } from '@jest/globals';
// import { Op } from 'sequelize';

// import { RoleModelPermissionLevel } from '../../../src/modules/core/types';
import { MutationType, RoleModelPermissionLevel } from '../../../src/modules/core/types';
import {  validateMutation } from '../../../src/modules/data/validation';

import { createFindOptions } from './utils';


describe('validate find options ', () => {
  test('doc, table, field has write access', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: true,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    const result = await validateMutation("tableName", MutationType.create, findOptions, model);
    expect(result).toBe(model);
  });
  test('table, field has write access, doc does not', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: false,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
      
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.create, findOptions, model);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("ENOPERMS");
    }
  });
  test('doc, table has write access, field does not', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: true,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: false,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.create, findOptions, model);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("EFCFAILED");
    }
  });
  test('self table - default userId validation - success', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: true,
        models: {
          tableName: {
            w: RoleModelPermissionLevel.self,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      userId: "test",
      _changed: {
        "id": "test"
      }
    }
    const result = await validateMutation("tableName", MutationType.create, findOptions, model);
    expect(result).toBe(model);
  });

  test('self table - default userId validation - denyOnSelf failure', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: true,
        models: {
          tableName: {
            w: RoleModelPermissionLevel.self,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      userId: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.create, findOptions, model, undefined, true);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("EDENYONSELF");
    }
  });
  test('self doc - default userId validation - success', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      userId: "test",
      _changed: {
        "id": "test"
      }
    }
    const result = await validateMutation("tableName", MutationType.create, findOptions, model);
    expect(result).toBe(model);
  });
  test('self doc - default userId validation - denyOnSelf failure', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      userId: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.create, findOptions, model, undefined, true);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("EDENYONSELF");
    }
  });
  test('self doc - custom validation - success', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        w: RoleModelPermissionLevel.self,
        models: {
          tableName: {
            w: true,
            f: {
              id: {
                w: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      userId: "test",
      _changed: {
        "id": "test"
      }
    }
    let set = false;
    const result = await validateMutation("tableName", MutationType.create, findOptions, model, async() => {
      set = true;
      return true
    }, false);
    expect(result).toBe(model);
    expect(set).toBe(true);
  });
  test('doc, table, field has update access', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        u: true,
        models: {
          tableName: {
            u: true,
            f: {
              id: {
                u: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    const result = await validateMutation("tableName", MutationType.update, findOptions, model);
    expect(result).toBe(model);
  });
  test('table, field has update access, doc does not', async () => {
    const findOptions = createFindOptions({id: "test"}, {
      schema: {
        u: false,
        models: {
          tableName: {
            u: true,
            f: {
              id: {
                u: true,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.update, findOptions, model);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("ENOPERMS");
    }
  });
  test('doc, table has update access, field does not', async () => {
    const findOptions = createFindOptions({id: "test"}, {

      schema: {
        u: true,
        models: {
          tableName: {
            u: true,
            f: {
              id: {
                u: false,
              },
            },
          },
        },
      },
    }, {
      where: {
        id: "test"
      }
    });
    const model = {
      id: "test",
      _changed: {
        "id": "test"
      }
    }
    try {
      await validateMutation("tableName", MutationType.update, findOptions, model);
      throw new Error("should not get here");
    } catch(err: any) {
      expect(err.message).toBe("EFCFAILED");
    }
  });
});