import path from "path";
import { globby, GlobEntry } from "globby";

export default async function LayoutGen(targetDir: string, cwd: string) {
  const targetCwd = path.resolve(cwd, targetDir);
  const entries = await globby("*", {
    expandDirectories: true,
    onlyFiles: false,
    markDirectories: false,
    cwd: targetCwd,
    objectMode: true,
  });
  return Promise.all(entries.map(processElement));
}

async function processElement(element: GlobEntry): Promise<any> {
  if (element.dirent.isDirectory()) {
    const entries = await globby("*", {
      expandDirectories: true,
      onlyFiles: false,
      markDirectories: false,
      cwd: path.resolve((element.dirent as any).path, element.name),
      objectMode: true,
    });
    return {
      name: element.name,
      type: "folder",
      children: await Promise.all(entries.map(processElement)),
    };
  } else {
    return {
      name: path.basename(element.name, path.extname(element.name)),
      type: "layout",
    }
  }
}
