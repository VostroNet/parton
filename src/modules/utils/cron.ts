import { SystemEvents, SystemEvent } from "../../types/events";
import { DataEvents } from "../data";
import { HealthzEvent, HealthzEvents } from "../healthz";
import moment, { Moment } from "moment";
import schedule from "node-schedule";
import cronParser from "cron-parser";
import { System } from "../../system";

export interface ICronModule extends SystemEvents, DataEvents, HealthzEvents {
  disableHealthzValidation?: boolean;
  lastPoll: Moment;
  healthzInterval: number;
  schedule: string;
  job: schedule.Job | undefined,
  lock: boolean,
  eventKey: string;
}

function calculateCronInterval(cron: string, bufferTime = 0, multiplyFactor = 1.1) {
  const interval = cronParser.parseExpression(cron);
  const next = interval.next();
  const prev = interval.prev();
  const diff = moment(next.toDate()).diff(moment(prev.toDate()), "seconds");
  return (diff * multiplyFactor) + bufferTime;
}

export interface ICronModuleOptions {
  schedule: string;
  eventKey: string;
  disableHealthzValidation?: boolean;
}

export function createCronModule(options: ICronModuleOptions): ICronModule {
  const cronModule: ICronModule = {
    lastPoll: moment(),
    healthzInterval: 60,
    job: undefined,
    lock: false,
    ...options,
    async[SystemEvent.Initialize](core: System) {
      this.healthzInterval = calculateCronInterval(this.schedule);
      return core;
    },
    async[SystemEvent.Ready](core: System) {
      this.lastPoll = moment();
      this.job = schedule.scheduleJob(this.schedule, async () => {
        if (this.lock) { //TODO: add skip check for healthz
          console.warn('Cron job already running, skipping this run');
          return;
        }

        this.lastPoll = moment();
        try {
          this.lock = true;
          await core.execute(this.eventKey, core);
        } catch (err) {
          //TODO: add error option to affect healthz
          try {
            await core.execute(SystemEvent.UncaughtError, core, err);
          } catch (rr) {
            console.error('Error in error handler - primary error', err);
            console.error('Error in error handler - handler error', rr);
          }
        }
        this.lock = false;
      });

      core.logger.debug(`cron module loaded: ${this.eventKey} - ${this.schedule}`, this);
      return core;
    },
    async[SystemEvent.Shutdown](core: System) {
      if (this.job) {
        this.job.cancel();
      }
      return core;
    }
  };
  if (!options.disableHealthzValidation) {
    cronModule[HealthzEvent.Check] = async function (this: ICronModule, prevResult: boolean, core: System) {
      const lastPoll = Math.abs(moment().diff(this.lastPoll, "seconds"));
      if (!(lastPoll > this.healthzInterval)) {
        return true;
      }
      return false;
    }
  }
  return cronModule;
}