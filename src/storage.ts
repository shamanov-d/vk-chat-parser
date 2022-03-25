import {existsSync, writeFileSync} from "fs";
import {resolve} from "path";

const STORAGE_NAME = resolve("storage.json");

export namespace Storage {
  export function get(): string | undefined {
    if (!existsSync(STORAGE_NAME)) return;
    const json = require(STORAGE_NAME);
    return json.token;
  }

  export function save(token: string) {
    writeFileSync(STORAGE_NAME, JSON.stringify({token}));
  }
}
