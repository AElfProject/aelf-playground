import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  ["src/contract.cs", require("./src/contract.cs")],
  ["src/state.cs", require("./src/state.cs")],
  ["client/client.ts", require("./client/client.ts.raw")],
  ["tests/test.cs", require("./tests/test.cs")],
];
