import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  ["src/contract.cs", require("./src/contract.cs")],
  ["src/state.cs", require("./src/state.cs")],
  ["client/client.ts", require("./client/client.ts.raw")],
  ["tests/native.test.ts", require("./tests/native.test.ts.raw")],
];
