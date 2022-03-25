import {existsSync, writeFileSync, readFileSync} from "fs";
import {resolve} from "path";

const STORAGE_NAME = resolve(process.cwd() + "/storage.json");

export namespace Storage {
  export function get(): string | undefined {
    if (!existsSync(STORAGE_NAME)) return;
    const {token} = JSON.parse(readFileSync(STORAGE_NAME).toString());
    return token;
  }

  export function save(token: string) {
    writeFileSync(STORAGE_NAME, JSON.stringify({token}));
  }
}
