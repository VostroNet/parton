import { DependencyInfo, ISlice, oneOf } from '@azerothian/sandwich';

import { SystemEvents } from './events';

export type IDependencies = {
  dependencies?: (string | oneOf | DependencyInfo)[];
  ignore?: string[];
};

export type IModule = ISlice & SystemEvents & IDependencies;

export type Context = {
  [key: string]: any;
};
export interface Project {
  config?: string;
}
