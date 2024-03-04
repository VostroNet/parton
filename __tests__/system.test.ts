import { describe, expect, test } from '@jest/globals';
import { LoafEvent } from '@vostro/sandwich';

import { System } from '../src/system';
import { SystemEvent } from '../src/types/events';


describe('system', () => {
  test('event firing order', async () => {
    const arr: string[] = [];
    const system = new System({
      name: 'event-order-test',
      slices: [
        {
          name: 'test1',
          [LoafEvent.Load]: async () => {
            arr.push('load');
          },
          [SystemEvent.Initialize]: async (system: System) => {
            arr.push('initialize');
            return system;
          },
          [SystemEvent.Ready]: async (system: System) => {
            arr.push('ready');
            return system;
          }
        }
      ]
    });
    await system.load();
    expect(arr).toHaveLength(1);
    expect(arr[0]).toBe('load');
    await system.initialize();
    await system.ready();
    await system.shutdown();
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe('load');
    expect(arr[1]).toBe('initialize');
    expect(arr[2]).toBe('ready');
  });

  test('dependency event function sorting', async () => {
    const arr: string[] = [];
    const system = new System({
      name: 'dependency-test',
      slices: [
        {
          name: 'test1',
          dependencies: ['test2'],
          [SystemEvent.Initialize]: async (system: System) => {
            arr.push('test1');
            return system;
          }
        },
        {
          name: 'test2',
          dependencies: [],
          [SystemEvent.Initialize]: async (system: System) => {
            arr.push('test2');
            return system;
          }
        }
      ]
    });
    await system.load();
    await system.initialize();

    await system.shutdown();
    expect(arr).toHaveLength(2);
    expect(arr[0]).toBe('test2');
    expect(arr[1]).toBe('test1');
  });
  // test("startup error handling", async () => {
  //   let fired  = false;
  //   const system = new System({
  //     name: 'error test',
  //     slices: [
  //       {
  //         name: 'test1',
  //         [SystemEvent.Initialize]: async (system: System) => {
  //           throw new Error("Boom")
  //           return system;
  //         },
  //         [SystemEvent.UncaughtError]: async (system: System, error: Error) => {
  //           fired = true;
  //           expect(error.message).toBe("Boom")
  //           return system;
  //         }
  //       },
  //     ]
  //   });
  //   await system.load();
  //   await system.initialize();
  //   expect(fired).toBe(true);
  // });


  test("startup error handling - error in uncaught", async () => {
    let uncaughtFired  = false;
    const system = new System({
      name: 'error test',
      slices: [
        {
          name: 'test1',
          [SystemEvent.Initialize]: async (system: System) => {
            throw new Error("Boom")
            return system;
          },
          [SystemEvent.UncaughtError]: async (system: System, error: Error) => {
            uncaughtFired = true;
            expect(error.message).toBe("Boom")
            throw new Error("Boom2")
            return system;
          }
        },
      ]
    });
    await system.load();
    let topLevelErrorFired = false;
    try {
      await system.initialize();
    } catch (error: any) {
      //TODO: mock logger.error and check for message
      topLevelErrorFired = true;
      expect(error.message).toBe("Boom2")
    }
    expect(topLevelErrorFired).toBe(true);
    expect(uncaughtFired).toBe(true);
    await system.shutdown();
  });
});