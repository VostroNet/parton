import { jest } from '@jest/globals';


jest.mock("http", () => {
  return {
    createServer: jest.fn(() => {
      return {
        listen: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };
    }),
  };
});
