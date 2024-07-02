import { GITHUB_URL } from "../../constants";
import {
  PgBlockExplorer,
  PgCommon,
  PgConnection,
  PgGlobal,
  PgProgramInfo,
  PgTerminal,
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

    let progress = 0.1;
    PgTerminal.log(
      `${PgTerminal.info(
        "Deploying..."
      )} This could take a while depending on the program size and network conditions.`
    );
    PgTerminal.setProgress(progress);

    let msg;
    try {
      const startTime = performance.now();
      const { txHash } = await processDeploy();
      if (txHash) {
        let txResult = await PgConnection.current.getTxResult(txHash);
        let deploymentStatus = txResult.Status;

        while (deploymentStatus === "PENDING") {
          PgTerminal.log(
            `${PgTerminal.info(
              "Checking deployment status..."
            )} ${deploymentStatus}`,
            { newLine: true }
          );
          await PgCommon.sleep(5000);

          txResult = await PgConnection.current.getTxResult(txHash);
          deploymentStatus = txResult.Status;

          progress += 0.1;
          PgTerminal.setProgress(progress);
        }

        if (deploymentStatus !== "MINED") {
          throw new Error("Deployment failed.");
        }

        txResult = await PgConnection.current.getTxResult(txHash, true);

        const proposalId = txResult.deserializedLogs.find(
          (i) => typeof i.proposalId === "string"
        )?.proposalId;

        if (!proposalId) {
          throw new Error("Proposal ID not found.");
        }

        let info = await PgBlockExplorer.current.getProposalInfo(proposalId);

        if (info.msg !== "success") {
          throw new Error("Proposal info not found.");
        }

        let status = info.data.proposal.status,
          isContractDeployed = info.data.proposal.isContractDeployed;

        while (status !== "expired" && isContractDeployed === false) {
          PgTerminal.log(
            `${PgTerminal.info("Checking proposal status...")} ${status}`,
            { newLine: true }
          );
          await PgCommon.sleep(5000);

          info = await PgBlockExplorer.current.getProposalInfo(proposalId);
          status = info.data.proposal.status;
          isContractDeployed = info.data.proposal.isContractDeployed;

          progress += 0.1;
          PgTerminal.setProgress(progress);
        }

        if (status === "expired" && isContractDeployed === false) {
          throw new Error("Contract not deployed after proposal expiry.");
        }

        const timePassed = (performance.now() - startTime) / 1000;

        msg = `${PgTerminal.success(
          "Deployment successful."
        )} Completed in ${PgCommon.secondsToTime(timePassed)}.\n
        View contract on aelf explorer: ${PgBlockExplorer.current.getAddressUrl(
          info.data.proposal.contractAddress
        )}.`;
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
  // Get connection
  const connection = PgConnection.current;

  if (!PgProgramInfo.dll) throw new Error("Program is not built.");

  let txHash: string | undefined;

  try {
    const result = await connection.deploy(PgProgramInfo.dll);
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
