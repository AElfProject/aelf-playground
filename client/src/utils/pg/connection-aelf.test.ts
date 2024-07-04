import { expect, test } from "vitest";
import { ConnectionAElf } from "./connection-aelf";

test("should return transaction details", async () => {
  const aelf = new ConnectionAElf();

  const id = `f500db9f933fb2ca0c27a0835bae0cdcf3342c36369236a313b2d29c9c331aee`;
  const result = await aelf.getTxResult(id);

  expect(result.TransactionId).toBe(id);
});

test("should return transaction details and deserialize logs", async () => {
  const aelf = new ConnectionAElf();

  const id = `f500db9f933fb2ca0c27a0835bae0cdcf3342c36369236a313b2d29c9c331aee`;
  const result = await aelf.getTxResult(id);
  const deserialize = await result.deserializeLogs();

  expect(deserialize.length).toBe(2);
});
