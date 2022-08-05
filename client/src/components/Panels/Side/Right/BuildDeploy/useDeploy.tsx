import { useCallback } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";

import {
  DEFAULT_PROGRAM,
  deployCountAtom,
  pgWalletAtom,
  Program,
  refreshPgWalletAtom,
  TerminalAction,
  terminalOutputAtom,
  terminalProgressAtom,
  terminalStateAtom,
  txHashAtom,
} from "../../../../../state";
import {
  PgCommon,
  PgDeploy,
  PgProgramInfo,
  PgTerminal,
  PgWallet,
} from "../../../../../utils/pg";
import { useAuthority } from "./useAuthority";

export const useDeploy = (program: Program = DEFAULT_PROGRAM) => {
  const [pgWallet] = useAtom(pgWalletAtom);
  const [pgWalletChanged] = useAtom(refreshPgWalletAtom);
  const [, setTerminalState] = useAtom(terminalStateAtom);
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setProgress] = useAtom(terminalProgressAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [, setDeployCount] = useAtom(deployCountAtom);

  const { connection: conn } = useConnection();
  const { authority, hasAuthority, upgradeable } = useAuthority();

  const runDeploy = useCallback(async () => {
    // This doesn't stop the current deploy but stops new deploys
    setTerminalState(TerminalAction.deployStop);

    PgTerminal.disable();
    PgTerminal.scrollToBottom();

    if (!pgWallet.connected) {
      setTerminal(
        `${PgTerminal.bold(
          "Playground Wallet"
        )} must be connected in order to deploy.`
      );
      PgTerminal.enable();
      return;
    }
    if (upgradeable === false) {
      setTerminal(PgTerminal.warning("The program is not upgradeable."));
      PgTerminal.enable();
      return;
    }
    if (hasAuthority === false) {
      setTerminal(
        `${PgTerminal.warning(
          "You don't have the authority to upgrade this program."
        )}
Program ID: ${PgProgramInfo.getPk()!.programPk}
Program authority: ${authority}
Your address: ${PgWallet.getKp().publicKey}`
      );
      PgTerminal.enable();
      return;
    }

    setTerminalState(TerminalAction.deployLoadingStart);

    let msg = `${PgTerminal.info(
      "Deploying..."
    )} This could take a while depending on the program size and network conditions.`;
    setTerminal(msg);
    setProgress(0.1);

    try {
      const startTime = performance.now();
      const txHash = await PgDeploy.deploy(
        conn,
        pgWallet,
        setProgress,
        program.buffer
      );
      const timePassed = (performance.now() - startTime) / 1000;
      setTxHash(txHash);

      msg = `${PgTerminal.success(
        "Deployment successful."
      )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
      setDeployCount((c) => c + 1);
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `${PgTerminal.error("Deployment error:")} ${convertedError}`;
      return 1; // To indicate error
    } finally {
      setTerminal(msg + "\n");
      setTerminalState(TerminalAction.deployLoadingStop);
      setProgress(0);
      PgTerminal.enable();
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    conn,
    pgWallet,
    pgWalletChanged,
    program,
    authority,
    hasAuthority,
    upgradeable,
    setTerminal,
    setTxHash,
    setTerminalState,
    setDeployCount,
  ]);

  return { runDeploy, pgWallet, hasAuthority, upgradeable };
};
