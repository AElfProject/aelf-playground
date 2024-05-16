import { useEffect, useState } from "react";

import { Emoji } from "../../../constants";
import {
  PgCommon,
  PgConnection,
  PgTerminal,
  PgTx,
  PgWallet,
} from "../../../utils/pg";

export const useAirdrop = () => {
  const [airdropAmount, setAirdropAmount] =
    useState<ReturnType<typeof PgCommon["getAirdropAmount"]>>(null);

  useEffect(() => {
    const { dispose } = PgConnection.onDidChangeCurrent((connection) => {
      setAirdropAmount(PgCommon.getAirdropAmount(connection.rpcEndpoint));
    });
    return () => dispose();
  }, []);

  const airdrop = async () => {
    await PgTerminal.process(async () => {
      if (!airdropAmount) return;

      let msg;
      try {
        PgTerminal.log(PgTerminal.info("Sending an airdrop request..."));

        const conn = PgConnection.current;
        const address = PgWallet.current!.wallet.address;

        // Airdrop tx is sometimes successful even when the balance hasn't
        // changed. To solve this, we check before and after balance instead
        // of confirming the tx.
        const beforeBalance = await conn.getBalance(address);

        const txHash = await conn.requestAirdrop(address);
        PgTx.notify(txHash);

        // Allow enough time for balance to update by waiting for confirmation
        await PgTx.confirm(txHash, conn);

        const afterBalance = await conn.getBalance(address);
        if (afterBalance > beforeBalance) {
          msg = `${Emoji.CHECKMARK} ${PgTerminal.success(
            "Success."
          )} Received ${PgTerminal.bold(airdropAmount.toString())} ELF.`;
        } else {
          msg = `${Emoji.CROSS} ${PgTerminal.error(
            "Error receiving airdrop."
          )}`;
        }
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        msg = `${Emoji.CROSS} ${PgTerminal.error(
          "Error receiving airdrop:"
        )}: ${convertedError}`;
      } finally {
        PgTerminal.log(msg + "\n");
      }
    });
  };

  return { airdrop, airdropCondition: !!airdropAmount };
};
