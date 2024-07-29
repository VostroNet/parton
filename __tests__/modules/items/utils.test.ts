import path from "path";

import { describe, expect, test } from '@jest/globals';

import { ItemData } from '../../../src/modules/items/types';
import {createItemDataFromFile, createItemDataFromImportItems, isItemReadable} from '../../../src/modules/items/utils';


describe("modules:items:utils", () => {
  test("virtual - parent and child import", async() => {
    let result: ItemData | undefined;
    try {
      result = await createItemDataFromImportItems([{
          "name": "files",
          "displayName": "Files",
          "data": {},
          "children": [{
            "name": "icon",
            "displayName": "Icon",
            "type": "file",
            "data": {
              "file": "./icon.png",
              "type": "image/png"
            }
          }]
        }
      ]);
    } catch(err: any) {
      expect(err).toBeUndefined();
    }
    expect(result).toBeDefined;
    expect(result?.items).toBeDefined;
    expect(result?.items).not.toBeNull();
    expect(result?.paths["/files"]).toBeDefined;
    expect(result?.items[result?.paths["/files"]]).not.toBeNull();
    expect(result?.items[result?.paths["/files"]].name).toBe("files");
    expect(result?.items[result?.paths["/files"]].displayName).toBe("Files");
    expect(result?.items[result?.paths["/files"]].type).toBe("folder");
    expect(result?.items[result?.paths["/files"]].data).toEqual({});
    expect(result?.items[result?.paths["/files"]].children).toBeDefined;
    expect(result?.items[result?.paths["/files"]].children).not.toBeNull();
    expect(result?.items[result?.paths["/files"]].children.length).toBe(1);
    expect(result?.paths["/files/icon"]).toBeDefined;
    expect(result?.items[result?.paths["/files/icon"]]).not.toBeNull();
    expect(result?.items[result?.paths["/files/icon"]].name).toBe("icon");
    expect(result?.items[result?.paths["/files/icon"]].displayName).toBe("Icon");
    expect(result?.items[result?.paths["/files/icon"]].type).toBe("file");
    expect(result?.items[result?.paths["/files/icon"]].data).toEqual({
      "file": "./icon.png",
      "type": "image/png"
    });
    expect(result?.items[result?.paths["/files/icon"]].children).toBeDefined;
    expect(result?.items[result?.paths["/files/icon"]].children).not.toBeNull();
    expect(result?.items[result?.paths["/files/icon"]].children.length).toBe(0);
    expect(result?.items[result?.paths["/files/icon"]].parentId).toBe(result?.paths["/files"]);
    expect(result?.items[result?.paths["/files"]].children).toEqual([result?.paths["/files/icon"]]);
  });

  test("files - createItemDataFromFile - with ref array", async() => {
    const filePath = path.resolve(__dirname, "./files/with-ref-array.json");
    const store = await createItemDataFromFile(filePath);
    expect(store).toBeDefined;
    expect(store.items).toBeDefined();
    expect(store.paths).toBeDefined();
    expect(store.paths["/with-ref-array-item1"]).toBeDefined();
    expect(store.paths["/with-ref-array-item1/ref-array-item1"]).toBeDefined();
    expect(store.paths["/with-ref-array-item1/ref-array-item2"]).toBeDefined();
  });

  test("files - createItemDataFromFile - with ref single", async() => {
    const filePath = path.resolve(__dirname, "./files/with-ref-single.json");
    const store = await createItemDataFromFile(filePath);
    expect(store).toBeDefined;
    expect(store.items).toBeDefined();
    expect(store.paths).toBeDefined();
    expect(store.paths["/with-ref-single-item1"]).toBeDefined();
    expect(store.paths["/with-ref-single-item1/ref-single-item1"]).toBeDefined();
  });
  test("files - createItemDataFromFile - complex with relative pathing", async() => {
    const filePath = path.resolve(__dirname, "./files/complex.json");
    const store = await createItemDataFromFile(filePath);
    expect(store).toBeDefined;
    expect(store.items).toBeDefined();
    expect(store.paths).toBeDefined();
    expect(store.paths["/item1"]).toBeDefined();
    expect(store.paths["/item1/ref-single-item1"]).toBeDefined();

    expect(store.paths["/item2"]).toBeDefined();
    expect(store.paths["/item2/ref-array-item1"]).toBeDefined();
    expect(store.paths["/item2/ref-array-item2"]).toBeDefined();

    expect(store.paths["/item3"]).toBeDefined();
    expect(store.paths["/item3/relative-item"]).toBeDefined();
    expect(store.paths["/item3/ref-single-item1"]).toBeDefined();
  });
  test("isItemReadable - test global read allow", async() => {
    const test = await isItemReadable("/website/test", {r: true, sets: []});
    expect(test).toBe(true);
  });
  test("isItemReadable - test global read deny", async() => {
    const test = await isItemReadable("/website/test", {r: false, sets: []});
    expect(test).toBe(false);
  });
  test("isItemReadable - test wildcard allow child", async() => {
    const test = await isItemReadable("/website/test", {r: false, sets: [{
      permission: {r: true},
      paths: ["/website/*"]
    }]});
    expect(test).toBe(true);
  });
  
  test("isItemReadable - test glonstar allow child", async() => {
    const test = await isItemReadable("/website/test/hello", {r: false, sets: [{
      permission: {r: true},
      paths: ["/website/**/*"]
    }]});
    expect(test).toBe(true);
  });
  test("isItemReadable - test wildcard allow parent", async() => {
    const test = await isItemReadable("/website", {r: false, sets: [{
      permission: {r: true},
      paths: ["/website/*"]
    }]});
    expect(test).toBe(true);
  });
});