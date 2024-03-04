// import { System } from '../system';
import promClient, { collectDefaultMetrics, Registry } from "prom-client";

import { System } from "../system";
import { Config } from "../types/config";
import { SystemEvent } from '../types/events';
import { IModule } from '../types/system';

import {
  ExpressEvent,
  ExpressModuleEvents,
} from './express';

export enum MetricsEventType {
  RegistryAvailable = 'metrics:registry',
}

export type MetricsEvents = {
  [MetricsEventType.RegistryAvailable]?: (registry: Registry, core: System) => Promise<void>;
};

export interface IMetricsModule
  extends IModule,
    ExpressModuleEvents {
  registry: Registry;
}

export interface MetricsConfig extends Config {
  metrics?: {
    disableDefaultMetrics?: boolean;
    extraLabels?: { [key in string]: string };
  };
}

export const metricsModule: IMetricsModule = {
  name: 'metrics',
  dependencies: ['express'],
  registry: null,
  [SystemEvent.Initialize]: async(system) => {
    system.setOptions(MetricsEventType.RegistryAvailable, {
      ignoreReturn: true,
    })
    const config = system.getConfig<MetricsConfig>();
    const registry = new promClient.Registry();
    registry.setDefaultLabels({
      app: system.name,
      ...(config.metrics?.extraLabels || {}),
    });
    if(!config.metrics?.disableDefaultMetrics) {
      collectDefaultMetrics({ prefix: `${system.name}_`, register: registry });
    }
    await system.execute(MetricsEventType.RegistryAvailable, registry, system);
    system.get<IMetricsModule>('metrics').registry = registry;
    return system;
  },
  [ExpressEvent.Initialize]: async (express, system) => {
    express.get('/metrics', async (req, res) => {
      const registry = system.get<IMetricsModule>('metrics').registry;
      if(!registry) {
        return res.status(500).send("No registry found");
      }
      return res.set("Content-Type", registry.contentType)
        .status(200)
        .end(await registry.metrics());
    });
    return express;
  },
};

export function createCounter(registry: Registry, name: string, help: string, labels: string[] = []): promClient.Counter {
  return new promClient.Counter({
    name: name,
    help: help,
    labelNames: labels,
    registers: [registry],
  });
}
export function createGauge(registry: Registry, name: string, help: string, labels: string[] = []): promClient.Gauge {
  return new promClient.Gauge({
    name: name,
    help: help,
    labelNames: labels,
    registers: [this.registry],
  });
}
export function createHistogram(name: string, help: string, labels: string[] = []): promClient.Histogram {
  return new promClient.Histogram({
    name: name,
    help: help,
    labelNames: labels,
    registers: [this.registry],
  });
}
export function createSummary(name: string, help: string, labels: string[] = []): promClient.Summary {
  return new promClient.Summary({
    name: name,
    help: help,
    labelNames: labels,
    registers: [this.registry],
  });
}

 