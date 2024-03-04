import fs from 'node:fs/promises';
import path from "node:path";

import * as mkdirp from "mkdirp";
import v8Profiler from 'v8-profiler-next';

v8Profiler.setGenerateType(1);

export function startProfiling(profileName: string, targetPath: string) {
  v8Profiler.startProfiling(profileName, true);
  mkdirp.sync(targetPath);
  return {
    stop: () => stopProfiling(profileName, targetPath),
    takeHeapProfile: (name: string) => takeHeapProfile(profileName, name, targetPath),
  };
}
export function stopProfiling(profileName: string, dir: string) : Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const cpuProfile = v8Profiler.stopProfiling(profileName);
      return cpuProfile.export(async(error, result: any) => {
        if (error) {
          return reject(error);
        }
        await fs.writeFile(path.join(dir, `${profileName}.cpuprofile`), result);
        cpuProfile.delete();
        return resolve();
      });
    } catch (err: any) {
      return reject(err);
    }
  })
}

export function takeHeapProfile(profileName: string, fileName: string, dir: string) : Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const snapShot = v8Profiler.takeSnapshot(profileName);
      return snapShot.export(async function (error, result: any) {
        if(error) {
          return reject(error);
        }
        await fs.writeFile(path.join(dir, `${fileName}.heapprofile`), result);
        snapShot.delete();
        return resolve();
      });
    } catch(err: any) {
      return reject(err);
    }
  });
}