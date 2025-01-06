import { generateJDTMinFromSchema } from '@azerothian/graphql-jtd';
import { IJtdMinRoot, JtdMinType } from '@azerothian/jtd-types';
import { GraphQLSchema } from 'graphql';

import { System } from '../system';
import { Role } from '../types/models/models/role';
import { IModule } from '../types/system';
import { createHexString } from '../utils/string';
import {
  createContextFromRequest,
  ExpressEvent,
  ExpressModuleEvents,
} from './express';
import { CoreModuleEvent, CoreModuleEvents } from './core/types';

import {CborEncoder} from "@jsonjoy.com/json-pack/lib/cbor/index"

export interface IGqlJdtModule
  extends IModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  jdtCache: {
    [key in string]: {
      pack: Uint8Array;
      schema: IJtdMinRoot
    }
  };
}

export const gqljdtModule: IGqlJdtModule = {
  name: 'gqljdt',
  dependencies: ['express', 'core', {
    optional: {
      before: ["auth"]
    }
  }],
  jdtCache: {},
  [CoreModuleEvent.GraphQLSchemaCreate]: async (
    schema: GraphQLSchema,
    role: Role,
    system: System,
  ) => {
    try {
      const roleHex = createHexString(role.id);
      const jtdMin = generateJDTMinFromSchema(schema, (type) => {
        if(type.toString() === "GQLTDate") {
          return JtdMinType.TIMESTAMP;
        }
        return undefined;
      });
      const encoder = new CborEncoder();
      const pack = encoder.encode(jtdMin);

      if (!system.get<IGqlJdtModule>('gqljdt').jdtCache) {
        system.get<IGqlJdtModule>('gqljdt').jdtCache = {};
      }
      system.get<IGqlJdtModule>('gqljdt').jdtCache[roleHex] = {
        pack,
        schema: jtdMin
      };
    } catch (e) {
      console.error(e);
    }
    return schema;
  },
  [ExpressEvent.Initialize]: async (express, system) => {
    express.get('/gqljdt.api', async (req, res) => {
      const { role } = await createContextFromRequest(req, system);
      if (role) {
        const roleHex = createHexString(role.id);
        return res.redirect(`/gqljdt.api/${roleHex}`);
      }
      return res.redirect('/');
    });
    express.get('/gqljdt.api/:roleHex', async (req, res) => {
      const { role } = await createContextFromRequest(req, system);
      if (role) {
        const roleHex = createHexString(role.id);
        if (roleHex !== req.params.roleHex) {
          return res.redirect(`/gqljdt.api/${roleHex}`);
        }
        const cache = system.get<IGqlJdtModule>('gqljdt').jdtCache[roleHex];
        if (!cache) {
          return res.status(404).send('Not found');
        }
        return res.write(cache.pack, () => {
          res.end();
        });
        // return res.send(cache.pack);
      }
      return res.redirect('/');
    });
    return express;
  },
};
export default gqljdtModule;
