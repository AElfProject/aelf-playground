import type { TupleFiles } from "./explorer";
import { zipSync, strToU8 } from "fflate";
import type { Zippable } from "fflate";

export function ZipFiles(files: TupleFiles) {
  const data: Zippable = files.reduce((acc, [path, str]) => {
    acc["." + path] = strToU8(str);

    return acc;
  }, {} as Zippable);

  return zipSync(data);
}
