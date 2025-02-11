// import { CliEventType, cliModule } from './modules/cli';
// import { Config, Project, SystemEventType } from './types/system';
import path from 'path';

import { Jam } from '@azerothian/sandwich';
import minimist from 'minimist';

import { System, withSession } from './system';
import { Config } from './types/config';
import { Project } from './types/system';
import { importFile } from './utils/fs';
import { createDebugLogger } from './utils/logger';
import merge from './utils/merge';

export default async (args: minimist.ParsedArgs) => {
  const cwd = path.resolve(process.cwd(), args.cwd || './');

  const projectPath = path.resolve(cwd, args.project || './parton.ts');

  const project = (await importFile<Project>(cwd, projectPath)) || {
    config: './src/config.ts',
  };

  if (args.config) {
    project.config = args.config;
  }

  let cfg: Jam | null;
  if (typeof project.config === 'string') {
    cfg = await importFile<Config>(cwd, project.config);
  } else if (project.config) {
    cfg = project.config;
  } else {
    throw new Error('No config found');
  }
  if (!cfg) {
    throw new Error('No config found');
  }

  const logger = createDebugLogger(cfg);
  merge<Config>(cfg, {
    cwd,
  });

  logger.debug('loading core');
  const system = new System(cfg);
  await withSession(async () => {
    logger.debug('firing load');
    await system.load();
    logger.debug('firing initialize');
    await system.initialize();
    logger.debug('firing configure');
    await system.configure();
    logger.debug('firing configure:complete');
    await system.configureComplete();
    logger.debug('firing system:ready');
    await system.ready();
  }, system);

  // await system.execute(SystemEvent.Ready, system);

  logger.debug('finished');
};
