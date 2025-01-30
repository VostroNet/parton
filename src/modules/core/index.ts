/* eslint-disable functional/no-loop-statements */
// import { promisify } from 'util';

import { stitchSchemas } from '@graphql-tools/stitch';
// import bodyParser from "body-parser";
import { GraphQLSchema } from 'graphql';
// import passport, { PassportStatic } from 'passport';

import { System } from '../../system';
import waterfall from '../../utils/waterfall';
// import { createContextFromRequest, ExpressEvent } from '../express';
import { CoreModuleEvent, IAuthProvider, ICoreModule, IRole, IUser } from './types';
import { SystemEvent } from '../../types/events';

export const coreModule: ICoreModule = {
  name: 'core',
  dependencies: [],
  schemas: {},
  ignore: ['schemas'],
  [SystemEvent.Configure]: async (system: System) => {
    system.setOptions(CoreModuleEvent.GraphQLSchemaConfigure, {
      ignoreReturn: true,
    });

    const roles: IRole[] | undefined = await system.execute(CoreModuleEvent.GetAllRoles, undefined, system); // TODO: add hook to return first true all
    if (!roles) {
      system.logger.error('no roles found');
      return;
    }
    await waterfall(roles, async (role) => {
      const schemas = await system.all<GraphQLSchema>(
        CoreModuleEvent.GraphQLSchemaConfigure,
        role,
        system,
      );
      system.logger.info(`stitching schemas for role ${role.name}`, schemas);
      const newSchema = stitchSchemas({
        subschemas: [
          ...schemas.filter((s) => s)
        ],
      });
      if (!newSchema) {
        system.logger.error(`no stitched schema returned for role ${role.name}`);
        return;
      }

      system.get<ICoreModule>('core').schemas[role.name] = newSchema;
      await system.execute(
        CoreModuleEvent.GraphQLSchemaCreate,
        newSchema,
        role,
        system,
      );
    });
    return system;
  },
};



export default coreModule;
