import fs from 'fs/promises';
import path from 'path';

import Sequelize from 'sequelize';

import { System } from '../../system';
import { Logger } from '../../types/logger';
import { Context } from '../../types/system';
import {
  camelToSnakeCase,
  capitalize,
  uncapitalize,
} from '../../utils/string';
import waterfall from '../../utils/waterfall';
import { getDatabase } from '.';
export async function generateTypes(
  system: System,
  _context: Context,
  cwd: string,
  outputDir: string,
) {
  const { logger } = system;
  logger.info('Generating types...');
  logger.debug(`cwd: ${cwd}`);
  logger.debug(`outputDir: ${outputDir}`);
  const outputPath = path.resolve(cwd, outputDir);
  //const { gqlManager } = system.modules.data as DataModule;
  const db = await getDatabase(system);
  // let models = '';
  let imports = '';
  let modelNames = '';
  let infRef = '';
  await waterfall(
    Object.keys(db.models).sort((a, b) => a.localeCompare(b)),
    async (modelName) => {
      logger.debug(`Generating type for model: ${modelName}`);
      const fileName = await processModel(
        modelName,
        db.models[modelName],
        outputPath,
        logger,
      );
      modelNames += `  ${modelName} = "${modelName}",\n`;
      infRef += `  [ModelNames.${modelName}]: typeof ${modelName};\n`;
      // models += `    ${modelName}: typeof ${modelName};\n`;
      imports += `import {${modelName}} from "./models/${fileName}";\n`;
    },
  );
  const database = `import Sequelize, { Model, ModelStatic } from "sequelize";

${imports}

export enum ModelNames {
${modelNames}
}


interface SConfig {
  [key: string]: ModelStatic<Model<any, any>>; 
${infRef}
}


export default class DatabaseContext extends Sequelize.Sequelize {
  declare models: SConfig
}\n`;
  try {
    await fs.mkdir(outputPath);
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  await fs.writeFile(path.resolve(outputPath, 'index.ts'), database);
}

async function processModel(
  modelName: string,
  model: Sequelize.ModelStatic<Sequelize.Model>,
  outputPath: string,
  logger: Logger,
) {
  // const attributes = model.getAttributes().map(attr => `    ${attr.fieldName}: ${attr.type};`).join("\n");

  let associations = '',
    instanceMethods = '',
    classMethods = '',
    after = '',
    eslintHeader = false;
  const associationsImports: any = {};
  if (model.associations) {
    logger.debug(
      `Generating associations: [${modelName}] - Total: ${Object.keys(model.associations).length}`,
    );
    associations = Object.keys(model.associations)
      .sort((a, b) => a.localeCompare(b))
      .reduce((ee, associationName) => {
        logger.debug(`Association: [${modelName}]->${associationName}`);
        const assoc = model.associations[associationName];
        const accessors = (assoc as any).accessors;
        if (accessors) {
          let accessorLog = '';
          Object.keys(accessors)
            .sort((a, b) => a.localeCompare(b))
            .forEach((accessor) => {
              const accessorName = accessors[accessor];
              const isMultiple = !accessors.addMultiple ? '' : '[]';
              switch (accessor) {
                case 'get':
                  accessorLog += ` get`;
                  instanceMethods += `  ${accessorName}(options: DbOptions): Promise<${assoc.target.name}${isMultiple}>;\n`;
                  break;
                case 'add':
                  accessorLog += ` add`;
                  instanceMethods += `  ${accessorName}(item: ${assoc.target.name}, options: DbOptions): Promise<${assoc.target.name}>;\n`;
                  break;
                case 'addMultiple':
                  accessorLog += ` addMultiple`;
                  instanceMethods += `  ${accessorName}(items: ${assoc.target.name}[], options: DbOptions): Promise<${assoc.target.name}[]>;\n`;
                  break;
                case 'count':
                  accessorLog += ` count`;
                  instanceMethods += `  ${accessorName}(options: DbOptions): Promise<number>;\n`;
                  break;
                case 'remove':
                  accessorLog += ` remove`;
                  instanceMethods += `  ${accessorName}(item: ${assoc.target.name}, options: DbOptions): Promise<void>;\n`;
                  break;
                case 'removeMultiple':
                  accessorLog += ` removeMultiple`;
                  instanceMethods += `  ${accessorName}(items: ${assoc.target.name}[], options: DbOptions): Promise<void>;\n`;
                  break;
                case 'set':
                  accessorLog += ` set`;
                  instanceMethods += `  ${accessorName}(item${isMultiple ? 's' : ''
                    }: ${assoc.target.name}${isMultiple}, options: DbOptions): Promise<void>;\n`;
                  break;
                case 'create':
                  accessorLog += ` create`;
                  instanceMethods += `  ${accessorName}(item: ${assoc.target.name}, options: DbOptions): Promise<${assoc.target.name}>;\n`;
                  break;
                case 'hasAll':
                  accessorLog += ` hasAll`;
                  instanceMethods += `  ${accessorName}(items: ${assoc.target.name}[], options: DbOptions): Promise<boolean>;\n`;
                  break;
                case 'hasSingle':
                  accessorLog += ` hasSingle`;
                  instanceMethods += `  ${accessorName}(item: ${assoc.target.name}, options: DbOptions): Promise<boolean>;\n`;
                  break;
                default:
                  // eslint-disable-next-line functional/no-throw-statements
                  throw new Error('UNHANDLED ACCESSOR');
              }
            });
          logger.debug(
            `Accessors: [${modelName}]->${associationName} :${accessorLog}`,
          );
        }
        logger.debug(
          `AssociationType: [${modelName}]->${associationName}: ${assoc.associationType}`,
        );
        const targetName = model.associations[associationName].target.name;
        switch (assoc.associationType) {
          case 'BelongsTo':
            ee += `  ${associationName}?: ${targetName} | null;\n`;
            break;
          case 'HasMany':
            ee += `  ${associationName}?: ${targetName}[] | null;\n`;
            break;
          case 'HasOne':
            ee += `  ${associationName}?: ${targetName} | null;\n`;
            break;
          case 'BelongsToMany':
            ee += `  ${associationName}?: ${targetName}[] | null;\n`;
            break;
        }
        associationsImports[targetName] = true;
        return ee;
      }, '');
  }
  const attributes = model.getAttributes();
  let creationFields = '',
    fields = '';
  Object.keys(attributes)
    .sort((a, b) => a.localeCompare(b))
    .forEach((attrName) => {
      let type = 'any';
      const typeName = attributes[attrName].type
        .toString({})
        .replace(/\(.*\)/, '');
      switch (typeName) {
        case 'VARCHAR':
        case 'STRING':
        case 'UUID':
        case 'CHAR':
        case 'TEXT':
        case 'ENUM':
          type = 'string';
          break;
        case 'INTEGER':
        case 'BIGINT':
        case 'DECIMAL':
        case 'FLOAT':
        case 'REAL':
          type = 'number';
          break;
        case 'BOOLEAN':
          type = 'boolean';
          break;
        case 'DATE':
        case 'DATEONLY':
        case 'TIME':
        case 'TIMESTAMP WITH TIME ZONE':
          type = 'Date | string';
          break;
        case 'BLOB':
          type = 'Buffer';
          break;
        default:
          type = 'any';
          break;
      }
      let isNull = '';
      if (attributes[attrName].allowNull) {
        isNull = ' | null';
      }
      fields += `  ${attrName}: ${type}${isNull};\n`;
      if (
        attrName !== 'id' &&
        attrName !== 'updatedAt' &&
        attrName !== 'createdAt'
      ) {
        creationFields += `  ${attrName}?: ${type}${isNull};\n`;
      }
    });
  instanceMethods += Object.keys((model.options as any).instanceMethods || {})
    .sort((a, b) => a.localeCompare(b))
    .reduce((ee, methodName) => {
      eslintHeader = true;
      const argName = `${modelName}${capitalize(methodName)}Args`;
      after += `export interface ${argName} { }\n`;
      ee += `  ${methodName}(args: ${argName}, context: DataContext): Promise<any>;\n`;
      return ee;
    }, '');
  classMethods += Object.keys((model.options as any).classMethods || {})
    .sort((a, b) => a.localeCompare(b))
    .reduce((ee, methodName) => {
      eslintHeader = true;
      const argName = `${modelName}${capitalize(methodName)}Args`;
      after += `export interface ${argName} { }\n`;
      ee += `  static ${methodName}(args: ${argName}, context: DataContext): Promise<any>;\n`;
      return ee;
    }, '');
  const associatedImports = Object.keys(associationsImports)
    .sort((a, b) => a.localeCompare(b))
    .reduce((ee, modelName) => {
      const fileName = camelToSnakeCase(uncapitalize(modelName), '-');
      ee += `import {${modelName}} from "./${fileName}";\n`;
      return ee;
    }, '');
  //TODO: add eslint check for DbOptions
  const code = `/* eslint-disable @typescript-eslint/no-unused-vars */
  ${eslintHeader
      ? '/* eslint-disable @typescript-eslint/no-empty-interface */\n'
      : ''
    }
import {DbOptions, Model} from "../data";

${associatedImports}
export interface ${modelName}CreationAttributes {
${creationFields}
}
export interface ${modelName}Attributes {
${fields}
}

export class ${modelName} extends Model<${modelName}Attributes, ${modelName}CreationAttributes> {
${fields || '\n'}${associations || '\n'}${instanceMethods || '\n'}${classMethods}
}
${after} `;
  // console.log("out", code);
  const fileName = camelToSnakeCase(uncapitalize(modelName), '-');
  try {
    await fs.mkdir(path.resolve(outputPath, './models'));
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  await fs.writeFile(
    path.resolve(outputPath, `./models/${fileName}.d.ts`),
    code,
  );
  return fileName;
}
