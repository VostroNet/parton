import { generateJDTMinFromSchema, generateJTDMinOptions } from '@azerothian/graphql-jtd';
import { IJtdMin, IJtdMinRoot, JtdMinType, } from '@azerothian/jtd-types';
import { GraphQLObjectTypeConfig, GraphQLScalarType, GraphQLSchema, GraphQLType } from 'graphql';

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

import { CborEncoder } from "@jsonjoy.com/json-pack/lib/cbor/index"
import { Config } from '../types/config';




export enum GqlJdtEvent {
  Configure = 'gqljdt:configure',
}

export interface GqlJdtConfig extends Config {
  gqljdt?: {
    enableCborEncoder?: boolean;
  };
}


export interface GqlJdtModuleEvents {
  [GqlJdtEvent.Configure]?(
    options: generateJTDMinOptions,
    core: System,
    module: IModule,
  ): Promise<Express.Application>;
}


export interface IGqlJdtModule
  extends IModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  jdtCache: {
    [key in string]: {
      header: string;
      pack: Uint8Array | string;
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
  [CoreModuleEvent.GraphQLSchemaCreate]: async function (
    schema: GraphQLSchema,
    role: Role,
    system: System,
  ) {
    try {
      const roleHex = createHexString(role.id);
      const options = await system.execute<generateJTDMinOptions>(GqlJdtEvent.Configure, {
        customScalarResolver: (name, type) => {
          if (type.toString() === "GQLTDate") {
            return JtdMinType.TIMESTAMP;
          }
          return undefined;
        }
      }, system, this);
      const jtdMin = generateJDTMinFromSchema(schema, options);
      const config = system.getConfig<GqlJdtConfig>();

      if (!system.get<IGqlJdtModule>('gqljdt').jdtCache) {
        system.get<IGqlJdtModule>('gqljdt').jdtCache = {};
      }
      if (config.gqljdt?.enableCborEncoder) {
        const encoder = new CborEncoder();
        const pack = encoder.encode(jtdMin);

        system.get<IGqlJdtModule>('gqljdt').jdtCache[roleHex] = {
          header: "Application/cbor",
          pack,
          schema: jtdMin
        };
      } else {
        system.get<IGqlJdtModule>('gqljdt').jdtCache[roleHex] = {
          header: "Application/json",
          pack: JSON.stringify(jtdMin, undefined, 0),
          schema: jtdMin
        };
      }
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
        return res.setHeader(`Content-Type`, cache.header)//.send(cache.pack);
          .write(cache.pack, () => {
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
