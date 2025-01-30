
import { IModule } from "../../types/system";
import { getDatabase } from "../data";
import { ExpressEvent, ExpressModuleEvents } from "../express";
// function bindReqResToRequest(instance: YogaServerInstance<any, any>, req: Request, res: Response, system: System) {
//   return (ctx: any) => {
//     return instance(req, res, ctx);
//   }

// }

// export const yogaDataModule: IModule & YogaModuleEvents = {
//   name: 'yoga-data',
//   [YogaEventType.OnRequest]: async (executed, execute, core) => {
//     const db = await getDatabase(core);
//     db.transaction(async (trx) => {
//       return execute({ transaction: trx });
//     });
//     return true;
//   }
// }


export const expressDataTransaction: IModule & ExpressModuleEvents = {
  name: 'express-data-transaction',
  dependencies: [{
    optional: {
      before: ["yoga", "auth", "auth-bearer", "auth-local", "auth-jwt"]
    }
  }],
  [ExpressEvent.Initialize]: async (express, system) => {
    express.use(async (req, res, next) => {

      if (req.url.startsWith('/graphql.api') || req.url.startsWith('/auth.api')) {
        const db = await getDatabase(system);
        db.transaction(async (trx) => {
          req["transaction"] = trx;
          return next();
        });
      }
      return next();
    });
    return express;
  }
}