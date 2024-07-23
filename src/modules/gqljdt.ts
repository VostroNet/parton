import { generateJDTMinFromSchema } from '@vostro/graphql-jtd';
import { IJtdMinRoot } from '@vostro/jtd-types';
import { GraphQLSchema } from 'graphql';

import { System } from '../system';
import { Role } from '../types/models/models/role';
import { IModule } from '../types/system';
import { createHexString } from '../utils/string';

import { CoreModuleEvent as CoreModuleEvent, CoreModuleEvents } from './core';
import {
  createContextFromRequest,
  ExpressEvent,
  ExpressModuleEvents,
} from './express';

export interface IGqlJdtModule
  extends IModule,
  CoreModuleEvents,
  ExpressModuleEvents {
  jdtCache: { [key in string]: IJtdMinRoot };
}

export const gqljdtModule: IGqlJdtModule = {
  name: 'gqljdt',
  dependencies: ['express', 'core'],
  jdtCache: {},
  [CoreModuleEvent.GraphQLSchemaCreate]: async (
    schema: GraphQLSchema,
    role: Role,
    system: System,
  ) => {
    const roleHex = createHexString(role.id);
    const jtdMin = generateJDTMinFromSchema(schema);
    if (!system.get<IGqlJdtModule>('gqljdt').jdtCache) {
      system.get<IGqlJdtModule>('gqljdt').jdtCache = {};
    }
    system.get<IGqlJdtModule>('gqljdt').jdtCache[roleHex] = jtdMin;
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
        return res.json(cache);
      }
      return res.redirect('/');
    });
    return express;
  },
};
export default gqljdtModule;
