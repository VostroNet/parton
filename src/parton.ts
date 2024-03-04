/* eslint-disable @typescript-eslint/no-var-requires */
import minimist from 'minimist';
const args = minimist(process.argv.slice(2));
if (args._.indexOf('start-server') > -1) {
  // const server = await import('./server');
  require('./server.ts')
    .default(args)
    .catch((error: any) => {
      console.error(error);
      process.exit(1);
    });
} else {
  require('./cli.ts')
    .default(args)
    .catch((error: any) => {
      console.error(error);
      process.exit(1);
    });
}
