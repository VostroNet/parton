import fs from 'fs/promises';
import path from 'path';

import { FileMapOptions, objectLoader } from "@azerothian/object-loader";

export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path, fs.constants.R_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function readYAMLFile<T>(path: string): Promise<T | null> {
  try {
    return objectLoader<T>(path, undefined, fileMapConfig);
  }
  catch (err) {
    console.error(err);
  }
  return null;
}

export async function readJSONFile<T>(path: string): Promise<T | null> {
  try {
    return objectLoader<T>(path, undefined, fileMapConfig);
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
  return objectLoader<T>(filePath, cwd, fileMapConfig);
}

const fileMapConfig: FileMapOptions = {
  fieldKey: "ref",
  customKeys: {
    "$env": (node) => {
      return process.env[node["$env"]] ?? "";
    }
  }
}

