import { PgConnection } from "./connection";
import { createDerivable, declareDerivable, derivable } from "./decorators";
import { ProposalInfo } from "./proposal-info-types";
import { PgSettings } from "./settings";

interface BlockExplorerImpl {
  /** Name of the block explorer */
  name: typeof PgSettings["other"]["blockExplorer"];
  /** Base URL of the explorer website */
  url: string;
  /**
   * Get the cluster URL parameter to add to the explorer URLs.
   *
   * @returns the cluster URL parameter
   */
  getClusterParam(): string;
  /**
   * Get the common URL i.e. a URL that follows simple enough `path` and
   * `value` in order to be able to derive the full URLs.
   *
   * @param path URL path
   * @param value last path value
   */
  getCommonUrl?(path: string, value: string): string;
  /**
   * Get address URL for the configured explorer.
   *
   * @param address public key
   * @returns the address URL
   */
  getAddressUrl?(address: string): string;
  /**
   * Get transaction URL for the configured explorer.
   *
   * @param txHash transaction signature
   * @returns the transaction URL
   */
  getTxUrl?(txHash: string): string;
  /**
   * Get proposal URL for the configured explorer.
   *
   * @param proposalId proposal ID
   * @returns the proposal URL
   */
  getProposalUrl?(proposalId: string): string;
  /**
   * Get proposal Info for the configured explorer.
   *
   * @param proposalId proposal ID
   * @returns the proposal URL
   */
  getProposalInfo?(proposalId: string): Promise<ProposalInfo>;
}

type BlockExplorer = Omit<
  Required<BlockExplorerImpl>,
  "getClusterParam" | "getCommonUrl"
>;

const createBlockExplorer = (b: BlockExplorerImpl) => {
  b.getCommonUrl ??= (p, v) => b.url + "/" + p + "/" + v + b.getClusterParam();
  b.getAddressUrl ??= (address) => b.getCommonUrl!("address", address);
  b.getTxUrl ??= (txHash) => b.getCommonUrl!("tx", txHash);

  return b as BlockExplorer;
};

const AELF_EXPLORER_URL = "https://explorer-test-side02.aelf.io";
const AELF_EXPLORER = createBlockExplorer({
  name: "AElf Explorer",
  url: AELF_EXPLORER_URL,
  getClusterParam: () => {
    return "";
  },
  getAddressUrl: (address: string) => `${AELF_EXPLORER_URL}/address/${address}`,
  getProposalUrl: (proposalId: string) =>
    `${AELF_EXPLORER_URL}/proposal/proposalsDetail/${proposalId}`,
  getProposalInfo: async (proposalId: string) => {
    const res = await fetch(
      `${AELF_EXPLORER_URL}/api/proposal/proposalInfo?proposalId=${proposalId}`
    );
    const data: ProposalInfo = await res.json();

    return data;
  },
});

const EXPLORERS = [AELF_EXPLORER];

const derive = () => ({
  /** The current block explorer based on user's block explorer setting */
  current: createDerivable({
    derive: () => {
      return (
        EXPLORERS.find((be) => be.name === PgSettings.other.blockExplorer) ??
        AELF_EXPLORER
      );
    },
    onChange: [
      PgSettings.onDidChangeOtherBlockExplorer,
      PgConnection.onDidChangeCluster,
    ],
  }),
});

@derivable(derive)
class _PgBlockExplorer {}

export const PgBlockExplorer = declareDerivable(_PgBlockExplorer, derive);
