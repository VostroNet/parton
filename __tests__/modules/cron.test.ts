import { describe, expect, test, jest } from '@jest/globals';

import { System } from '../../src/system';
import { createCronModule } from "../../src/modules/cron";
import { sleep } from '../../src/utils/sleep';
import { HealthzEvent } from '../../src/modules/healthz';

enum CronTestEvents {
  TestEvent = "cron:test"
}

describe('modules:utils:cron', () => {
  test('test basic firing', async () => {
    let i = 0;
    try {
      const core = new System({
        name: 'cron-test',
        slices: [createCronModule({
          eventKey: CronTestEvents.TestEvent,
          schedule: "*/1 * * * * *",
          disableHealthzValidation: false
        }),
        {
          name: 'test1',
          [CronTestEvents.TestEvent]: async () => {
            i++;
          }
        }]
      });
      await core.load();
      await core.initialize();
      await core.ready();
      await sleep(2000);
      await core.shutdown();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    expect(i).toBeGreaterThan(0)
  }, 10000);
  test('test health failure firing', async () => {
    let result = undefined;
    try {
      const core = new System({
        name: 'cron-test',
        slices: [createCronModule({
          eventKey: CronTestEvents.TestEvent,
          schedule: "*/2 * * * * *",
          disableHealthzValidation: false
        }),
        {
          name: 'test1',
          [CronTestEvents.TestEvent]: async () => {
            await sleep(5000);
          }
        }]
      });
      await core.load();
      await core.initialize();
      await core.ready();
      await sleep(3000);
      result = await core.execute(HealthzEvent.Check, true, core);
      await sleep(2000)
      await core.shutdown();
    } catch (err: any) {
      expect(err).toBeUndefined();
    }
    expect(result).toBe(false);
  }, 10000);
});
