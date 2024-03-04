import { Jam } from '@vostro/sandwich';
// import {Logger} from "./logger";

// export type ConfigModule = string | ISlice

export type Config = Jam & {
  devMode?: boolean;
  // name: string;
  // modules: ConfigModule[];
  // logger?: Logger;
  // allowInCompat?: boolean;
  // cwd?: string;
};
