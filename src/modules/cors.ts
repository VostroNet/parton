

import cors, { CorsOptions } from "cors";
import { ExpressEvent, IExpressModule } from "./express";
import { System } from "../system";


export enum CorsEvent {
  Configure = "cors:configure",
  Origin = "cors:origin",
}

export interface ICorsModule {
  [CorsEvent.Origin]: (
    requestOrigin: string,
    system: System,
  ) => Promise<boolean>;
  [CorsEvent.Configure]: (
    options: CorsOptions,
    system: System,
  ) => Promise<CorsOptions>;
}

// export interface CorsModule extends IExpressModule {
//   options: CorsOptions
// }


export const corsModule: IExpressModule = {
  name: "cors",
  dependencies: [{
    required: {
      before: ["express"],
    },
    optional: {
      after: ["gqljdt", "core"]
    }
  }],
  [ExpressEvent.Initialize]: async function (app, system) {
    const config = await system.execute<CorsOptions>(CorsEvent.Configure, {}, system);
    const opts = {
      async origin(requestOrigin, callback) {
        try {
          // if any function returns false, the origin will be blocked
          const result = await originProcessor(requestOrigin, system);
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      },
      ...config,
    };
    app.use(cors(opts));
    return app;
  },
};

export async function originProcessor(requestOrigin: string, system: System): Promise<boolean> {
  return system.condition(
    CorsEvent.Origin,
    async (result: boolean) => result === true,
    false,
    requestOrigin,
  );
}

