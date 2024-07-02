import {
  Commitment,
  PublicKey,
  RecentPrioritizationFees,
} from "@solana/web3.js";
// @ts-ignore
import AElf from "aelf-sdk";
const { deserializeLog } = AElf.pbUtils;

interface Contract {}

interface GetBalanceParams {
  owner: string;
  symbol: string;
}

interface GetBalanceResponse extends GetBalanceParams {
  balance: string;
}

interface TokenContract extends Contract {
  GetBalance: {
    call: (params: GetBalanceParams) => Promise<GetBalanceResponse>;
  };
}

interface GenesisContract extends Contract {
  GetContractAddressByName: {
    call: (params: string) => Promise<string>;
  };
  DeployUserSmartContract: (params: {
    category: 0;
    code: string;
  }) => Promise<{ TransactionId: string }>;
}

interface AElfChain {
  currentProvider: {
    host: string;
  };
  chain: {
    getTxResult: (txId: string) => Promise<TransactionResult>;
    contractAt: <T>(address: string, wallet: any) => Promise<T>;
    getContractFileDescriptorSet: (address: string) => Promise<any>;
  };
}

let cached: Record<string, any> = {};
export class ConnectionAElf {
  endpoint;
  genesisContract: GenesisContract | undefined;
  tokenContract: TokenContract | undefined;

  constructor(
    endpoint: string = "https://tdvw-test-node.aelf.io",
    newWallet: any = AElf.wallet.createNewWallet()
  ) {
    this.endpoint = endpoint;
    this.init(endpoint, newWallet);
  }

  get aelf(): AElfChain {
    return new AElf(new AElf.providers.HttpProvider(this.endpoint));
  }

  async init(
    endpoint: string = "https://tdvw-test-node.aelf.io",
    newWallet: any = AElf.wallet.createNewWallet()
  ) {
    this.endpoint = endpoint;

    // get genesis contract address
    const GenesisContractAddress =
      await ConnectionAElf.getGenesisContractAddress(endpoint);
    // get genesis contract instance
    this.genesisContract = await this.aelf.chain.contractAt(
      GenesisContractAddress,
      newWallet
    );

    if (!this.genesisContract)
      throw new Error("Error initializing Genesis Contract.");

    // Get contract address by the read only method `GetContractAddressByName` of genesis contract
    const tokenContractAddress = await ConnectionAElf.getTokenContractAddress(
      this.genesisContract
    );

    this.tokenContract = (await this.aelf.chain.contractAt(
      tokenContractAddress,
      newWallet
    )) as TokenContract;

    if (!this.tokenContract)
      throw new Error("Error initializing Token Contract.");

    console.log("ConnectionAElf initialized.");
  }

  get rpcEndpoint() {
    return this.endpoint || "https://tdvw-test-node.aelf.io";
  }

  static async getGenesisContractAddress(endpoint: string) {
    const aelf = new AElf(new AElf.providers.HttpProvider(endpoint));
    const chainStatus = await aelf.chain.getChainStatus();
    return chainStatus.GenesisContractAddress;
  }

  static async getTokenContractAddress(genesisContract: GenesisContract) {
    const tokenContractName = "AElf.ContractNames.Token";
    return await genesisContract.GetContractAddressByName.call(
      AElf.utils.sha256(tokenContractName)
    );
  }

  async confirmTransaction(txHash: string, commitment?: string) {
    return {
      value: {
        err: null,
      },
    };
  }

  async sendRawTransaction(serializedTransaction: Buffer, opts: any) {
    return "";
  }

  async getLatestBlockhash() {
    return {
      blockhash: "",
    };
  }

  async getRecentPrioritizationFees() {
    return [] as RecentPrioritizationFees[];
  }

  async getAccountInfo(idlPk: PublicKey) {
    return {
      data: Buffer.from(""),
    };
  }

  async getSlot() {
    return 0;
  }

  get commitment() {
    return undefined as Commitment | undefined;
  }

  async getSignaturesForAddress(idlPk: PublicKey, opts: any) {
    return [];
  }

  async getBalance(address: string) {
    if (!this.tokenContract) return 0;

    const res = await this.tokenContract?.GetBalance.call({
      symbol: "ELF",
      owner: address,
    });

    return Number(res?.balance || 0);
  }

  removeAccountChangeListener(id: number) {}

  onAccountChange(idlPk: PublicKey, callback: (acc: any) => void) {
    return 0;
  }

  async onWalletChange(wallet: any) {
    await this.init(this.endpoint, wallet);
  }

  async requestAirdrop(address: string) {
    const res = await fetch(
      `https://faucet.aelf.dev/api/claim?walletAddress=${address}`,
      {
        method: "POST",
      }
    );

    const data: { isSuccess: boolean; code: number; message: string } =
      await res.json();

    if (data.isSuccess === false) {
      throw new Error(data.message);
    }

    return data.message;
  }

  async getMinimumBalanceForRentExemption(size: number) {
    return 0;
  }

  async deploy(code: string) {
    const res = await this.genesisContract?.DeployUserSmartContract({
      category: 0,
      code,
    });

    if (res) {
      return await this.getTxResult(res.TransactionId);
    }

    return null;
  }

  async getProto(address: string, aelf: AElfChain) {
    const key = aelf.currentProvider.host + "_" + address;
    if (!cached[key])
      cached[key] = await aelf.chain.getContractFileDescriptorSet(address);
    return AElf.pbjs.Root.fromDescriptor(cached[key]);
  }

  async getTxResult(txId: string, shouldDeserializeLogs?: boolean) {
    try {
      const txResult = await this.aelf.chain.getTxResult(txId);

      if (!shouldDeserializeLogs) return { ...txResult, deserializedLogs: [] };

      const services = await Promise.all(
        txResult.Logs.map(
          async ({ Address }) => await this.getProto(Address, this.aelf)
        )
      );

      const deserializedLogs: Array<Record<string, string>> =
        await deserializeLog(txResult.Logs, services);

      return { ...txResult, deserializedLogs };
    } catch (err: unknown) {
      const res: TransactionErrorResponse = err as TransactionErrorResponse;
      throw new TransactionError(res.Error, res);
    }
  }
}

interface Log {
  Address: string;
  Name: string;
  Indexed: Array<string>;
  NonIndexed: string | null;
}

interface TransactionErrorResponse {
  TransactionId: string;
  Status: string;
  Logs: Array<Log>;
  Bloom: null;
  BlockNumber: 0;
  BlockHash: null;
  Transaction: null;
  ReturnValue: "";
  Error: string;
  TransactionSize: 0;
}

export class TransactionError extends Error {
  data;

  constructor(message: string, data: TransactionErrorResponse) {
    super(message);
    this.data = data;
  }
}

export interface TransactionResult {
  TransactionId: string;
  Status: "PENDING" | "MINED";
  Logs: [];
  Bloom: string;
  BlockNumber: number;
  BlockHash: string | null;
  Transaction: {
    From: string;
    To: string;
    RefBlockNumber: number;
    RefBlockPrefix: string;
    MethodName: string;
    Params: string;
    Signature: string;
  };
  ReturnValue: string;
  Error: string | null;
  TransactionSize: number;
}

export function convertAElfErrorMessages(err: TransactionErrorResponse) {
  return `\nTransaction ID: ${err.TransactionId}\nError: ${err.Error}`;
}
