export type Logger = {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  err: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
};

export type SystemLogger = {
  debug: (module: string, message: string, ...args: any[]) => void;
  info: (module: string, message: string, ...args: any[]) => void;
  warn: (module: string, message: string, ...args: any[]) => void;
  error: (module: string, message: string, ...args: any[]) => void;
  err: (module: string, message: string, ...args: any[]) => void;
  log: (module: string, message: string, ...args: any[]) => void;
};
