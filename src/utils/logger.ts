import debug from 'debug';

import { Config } from '../types/config';
import { Logger } from '../types/logger';

export function createDebugLogger(config: Config, prefix?: string): Logger {
  let p = '';
  if (prefix) {
    p = `:${prefix}`;
  }
  const name = config.name || 'parton';
  return {
    debug: debug(`${name}${p}:debug`),
    error: debug(`${name}${p}:error`),
    err: debug(`${name}${p}:err`),
    info: debug(`${name}${p}:info`),
    log: debug(`${name}${p}:log`),
    warn: debug(`${name}${p}:warn`),
  };
}

const loggerFuncs: {
  [key: string]: {
    debug: (...rest: any[]) => void;
    error: (...rest: any[]) => void;
    err: (...rest: any[]) => void;
    info: (...rest: any[]) => void;
    log: (...rest: any[]) => void;
    warn: (...rest: any[]) => void;
  };
} = {};
function getLoggerFunc(config: Config, module: string) {
  if (!loggerFuncs[module]) {
    loggerFuncs[module] = createDebugLogger(config, module);
  }
  return loggerFuncs[module];
}

export function createSystemLogger(config: Config): Logger {
  return {
    debug(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).debug(...rest);
    },
    error(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).error(...rest);
    },
    err(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).err(...rest);
    },
    info(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).info(...rest);
    },
    log(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).log(...rest);
    },
    warn(module: string, ...rest: any[]) {
      return getLoggerFunc(config, module).warn(...rest);
    },
  };
}
