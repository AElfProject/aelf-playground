import { Keypair } from "@solana/web3.js";

import { GITHUB_URL } from "../../constants";
import { BpfLoaderUpgradeable } from "../../utils/bpf-upgradeable-browser";
import {
  PgCommon,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgServer,
  PgTerminal,
  PgTx,
  PgWallet,
} from "../../utils/pg";
import { createCmd } from "../create";
import { isPgConnected } from "../validation";
import {
  ErrorInterface,
  convertAElfErrorMessages,
} from "../../utils/pg/connection-aelf";

export const deploy = createCmd({
  name: "deploy",
  description: "Deploy your program",
  run: async () => {
    PgGlobal.update({ deployState: "loading" });

    PgTerminal.log(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    PgTerminal.setProgress(0.1);

    let msg;
    try {
      const startTime = performance.now();
      const { txHash } = await processDeploy();
      if (txHash) {
        const timePassed = (performance.now() - startTime) / 1000;
        PgTx.notify(txHash);

        msg = `${PgTerminal.success(
          "Deployment successful."
        )} Completed in ${PgCommon.secondsToTime(timePassed)}.`;
      }
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `Deployment error: ${convertedError}`;
      return 1; // To indicate error
    } finally {
      if (msg) PgTerminal.log(msg + "\n");
      PgTerminal.setProgress(0);
      PgGlobal.update({ deployState: "ready" });
    }
  },
  preCheck: [isPgConnected, checkDeploy],
});

/** Check whether the state is valid for deployment. */
async function checkDeploy() {
  if (!PgProgramInfo.dll) {
    throw new Error(PgTerminal.warning("The program is not built."));
  }
}

/** Maximum amount of transaction retries */
const MAX_RETRIES = 5;

/** Sleep amount multiplier each time a transaction fails */
const SLEEP_MULTIPLIER = 1.8;

/**
 * Deploy the current program.
 *
 * @returns the deployment transaction signature if the deployment succeeds
 */
const processDeploy = async () => {
  const programPk = PgProgramInfo.pk;
  if (!programPk) throw new Error("Program id not found.");

  // Regular deploy without custom elf upload
  let programBuffer = PgProgramInfo.importedProgram?.buffer;
  if (!programBuffer?.length) {
    if (!PgProgramInfo.uuid) throw new Error("Program is not built.");
    programBuffer = await PgServer.deploy(PgProgramInfo.uuid);
  }

  // Get connection
  const connection = PgConnection.current;

  if (!PgProgramInfo.dll) throw new Error("Program is not built.");

  try {
    const codeHash = await connection.deploy(PgProgramInfo.dll);
    PgTerminal.log("CodeHash: " + codeHash);
  } catch (err) {
    let error: ErrorInterface = err as ErrorInterface;

    throw new Error(convertAElfErrorMessages(error));
  }

  let txHash: string | undefined;

  let errorMsg =
    "Please check the browser console. If the problem persists, you can report the issue in " +
    GITHUB_URL +
    "/issues";

  // Most likely the user doesn't have the upgrade authority
  if (!txHash) {
    throw new Error(errorMsg);
  }

  return { txHash };
};

/** Load buffer with the ability to pause, resume and cancel on demand. */
const loadBufferWithControl = (
  ...args: Parameters<typeof BpfLoaderUpgradeable["loadBuffer"]>
) => {
  return new Promise<
    | {
        cancelled: true;
        success?: never;
      }
    | {
        cancelled?: never;
        success: true;
      }
  >(async (res) => {
    const abortController = new AbortController();
    args[2] = { ...args[2], abortController };

    const term = await PgTerminal.get();
    const handle = async () => {
      if (abortController.signal.aborted) {
        await term.executeFromStr("yes");
      } else {
        abortController.abort();
        const shouldContinue = await term.waitForUserInput(
          "Continue deployment?",
          { confirm: true, default: "yes" }
        );
        dispose();

        if (shouldContinue) {
          PgGlobal.deployState = "loading";
          loadBufferWithControl(...args).then(res);
        } else {
          PgGlobal.deployState = "cancelled";
          res({ cancelled: true });
        }
      }
    };

    let prevState = PgGlobal.deployState;
    const { dispose } = PgGlobal.onDidChangeDeployState((state) => {
      if (
        prevState !== state &&
        (prevState === "paused" || state === "paused")
      ) {
        handle();
      }
      prevState = state;
    });

    await BpfLoaderUpgradeable.loadBuffer(...args);

    if (!abortController.signal.aborted) {
      dispose();
      res({ success: true });
    }
  });
};
