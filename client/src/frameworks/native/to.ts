import { convertToPlaygroundCommon, selectProgram } from "../common";
import type { TupleFiles } from "../../utils/pg";

/**
 * {@link Framework.importToPlayground}
 */
export const convertToPlayground = async (files: TupleFiles) => {
  return convertToPlaygroundCommon(files);
};
