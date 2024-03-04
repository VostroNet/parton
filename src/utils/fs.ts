import fs from 'fs/promises';
import path from 'path';

export async function readJSONFile<T>(path: string): Promise<T | null> {
  try {
    const file = await fs.readFile(path, 'utf8');
    return JSON.parse(file);
  } catch (err) {
    console.error(err);
  }
  return null;
}
export async function importFile<T>(
  cwd: string,
  targetPath: string,
): Promise<T | null> {
  const filePath = path.resolve(cwd, targetPath);
  let file: any;
  const ext = path.extname(filePath);
  switch (ext) {
    case '.json':
      return readJSONFile(filePath);
    case '.js':
    case '.ts':
      file = await import(filePath);
      if (file.default) {
        file = file.default;
      }
      break;
  }
  return file;
}

// export interface RefObject {
//   ref?: string;
// }

// export async function loadRefObject(ref: string) {
//   let result: any = {};
//   // eslint-disable-next-line functional/no-loop-statements
//   do {
//     const cwd = path.dirname(ref);
//     const data = await readJSONFile<any>(ref);
//     if(!data) {
//       return undefined;
//     }
//     result = merge(result, data);
//     if (data.ref) {
//       ref = path.resolve(cwd, data.ref);
//     } else {
//       ref = undefined;
//     }
//   } while (ref);
//   if (result.ref) {
//     delete result.ref;
//   }
//   return result;
// }
