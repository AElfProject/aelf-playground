/** Name that will be showed in the UI */
export enum NetworkName {
  TESTNET = "testnet",
  CUSTOM = "custom",
}

/** RPC endpoint */
export enum Endpoint {
  TESTNET = "https://tdvw-test-node.aelf.io",
  CUSTOM = "CUSTOM",
}

interface Network {
  name: NetworkName;
  endpoint: Endpoint;
}

/** Default networks that users can choose from */
export const NETWORKS: Network[] = [
  {
    name: NetworkName.TESTNET,
    endpoint: Endpoint.TESTNET,
  },
  {
    name: NetworkName.CUSTOM,
    endpoint: Endpoint.CUSTOM,
  },
];
