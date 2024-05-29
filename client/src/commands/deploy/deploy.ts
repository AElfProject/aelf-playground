import { GITHUB_URL } from "../../constants";
import {
  PgCommon,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgServer,
  PgTerminal,
  PgTx,
} from "../../utils/pg";
import { createCmd } from "../create";
import { isPgConnected } from "../validation";
import {
  TransactionError,
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

  let txHash: string | undefined;

  try {
    const result = await connection.deploy(PgProgramInfo.dll);
    PgTerminal.log("Transaction ID: " + result?.TransactionId);
    txHash = result?.TransactionId;
  } catch (err) {
    if (err instanceof TransactionError) {
      throw new Error(convertAElfErrorMessages(err.data));
    }
  }

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
