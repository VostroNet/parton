// import { IncomingMessage, Server, ServerResponse } from 'http';

import { describe, expect, test, jest } from '@jest/globals';
import { System } from '../../src/system';
import { IModule } from '../../src/types/system';
const app = {
  use: jest.fn(),
  get: jest.fn(),
  listen: () => {
    return {
      close: (cb: any) => cb()
    }
  }
}
jest.doMock('express', () => {
  return () => {
    return app
  }
})
import healthzModule, { HealthzEvent, HealthzEvents } from '../../src/modules/healthz';
import { getMockReq, getMockRes } from '@jest-mock/express'
// import { CoreConfig } from '../../src/modules/core/types';
// import dataModule from '../../src/modules/data';
// import coreModule from '../../src/modules/core';
// import itemModule from '../../src/modules/items';
// import { fieldHashModule } from '../../src/modules/utils/field-hash';
// import { roleUpsertModule } from '../../src/modules/utils/role-upsert';
// import { databaseConfig } from '../utils/config';

describe('modules:healthz', () => {
  test('successful health check', async () => {
    app.get.mockClear();
    const arr: string[] = [];

    const module: IModule & HealthzEvents = {
      name: 'test1',
      [HealthzEvent.Check]: async () => {
        return true;
      },
    };
    const config = {
      name: 'health-test',
      slices: [
        healthzModule,
        module,
      ]
    }
    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();
    expect(app.get.mock.lastCall).toBeDefined();

    const [uri, func]: any = app.get.mock.lastCall || [];
    expect(uri).toBe("/healthz");
    const req = getMockReq({ params: { id: '123' } })
    const { res, next, clearMockRes } = getMockRes();

    await func(req, res, next);
    expect((res.send as any).mock.calls).toHaveLength(1);
    expect((res.status as any).mock.calls[0][0]).toBe(200);
    expect((res.send as any).mock.calls[0][0]).toBe("OK");
    await core.shutdown();
  });
  test('failure health check', async () => {
    app.get.mockClear();
    const arr: string[] = [];

    const module: IModule & HealthzEvents = {
      name: 'test1',
      [HealthzEvent.Check]: async () => {
        return false;
      },
    };
    const config = {
      name: 'health-test',
      slices: [
        healthzModule,
        module,
      ]
    }
    const core = new System(config);
    await core.load();
    await core.initialize();
    await core.ready();
    expect(app.get.mock.lastCall).toBeDefined();

    const [uri, func]: any = app.get.mock.lastCall || [];
    expect(uri).toBe("/healthz");
    const req = getMockReq({ params: { id: '123' } })
    const { res, next, clearMockRes } = getMockRes();

    await func(req, res, next);
    expect((res.send as any).mock.calls).toHaveLength(1);
    expect((res.status as any).mock.calls[0][0]).toBe(500);
    expect((res.send as any).mock.calls[0][0]).toBe("Not OK")
    await core.shutdown();
  });
});
