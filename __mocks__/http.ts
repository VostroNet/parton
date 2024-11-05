import { jest } from '@jest/globals';

jest.mock("http", () => {
  const http: any = jest.requireActual("http");
  return {
    ...http,
    createServer: jest.fn(() => {
      return {
        listen: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };
    }),
  };
});
