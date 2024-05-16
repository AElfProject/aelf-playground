import { ConnectionConfig } from "@solana/web3.js";

import { PgCommon } from "./common";
import { createDerivable, declareDerivable, derivable } from "./decorators";
import { PgSettings } from "./settings";
import { ConnectionAElf } from "./connection-aelf";

/** Optional `connection` prop */
export interface ConnectionOption {
  connection?: typeof PgConnection["current"];
}

/** testnet or custom */
export type Cluster = "testnet" | "custom";

const derive = () => ({
  /** Globally sycned connection instance */
  current: createDerivable({
    // It's important that this method returns immediately because connection
    // instance is used throughout the app. For this reason, the connection for
    // Playnet will be returned without awaiting the initialization. After the
    // initialization, `PgPlaynet.onDidInit` will be triggered and this method
    // will run again to return the overridden connection instance.
    derive: () => {
      return _PgConnection.create();
    },
    onChange: [
      PgSettings.onDidChangeConnectionEndpoint,
      PgSettings.onDidChangeConnectionCommitment,
    ],
  }),

  /** Whether there is a successful connection */
  isConnected: createDerivable({
    derive: _PgConnection.getIsConnected,
    onChange: (cb) => {
      // Keep track of `isConnected` and only run the `cb` when the value
      // actually changes. This is because the decorators such as `derivable`
      // and `updatable` trigger a change event each time the value is set
      // independent of whether the value has changed unlike React which only
      // re-renders when the memory location of the value changes.
      //
      // TODO: Allow specifying whether the value should be compared with the
      // previous value and trigger the change event **only if** there is a
      // difference in comparison.
      let isConnected = false;

      // Refresh every 60 seconds on success
      const successId = setInterval(async () => {
        if (!isConnected) return;

        isConnected = await PgConnection.getIsConnected();
        if (!isConnected) cb();
      }, 60000);

      // Refresh every 5 seconds on error
      const errorId = setInterval(async () => {
        if (isConnected) return;

        isConnected = await PgConnection.getIsConnected();
        if (isConnected) cb();
      }, 5000);

      return {
        dispose: () => {
          clearInterval(successId);
          clearInterval(errorId);
        },
      };
    },
  }),

  /** Current cluster name based on the current endpoint */
  cluster: createDerivable({
    derive: _PgConnection.getCluster,
    onChange: PgSettings.onDidChangeConnectionEndpoint,
  }),

  /** Whether the cluster is down. `null` indicates potential connection error. */
  isClusterDown: createDerivable({
    derive: _PgConnection.getIsClusterDown,
    onChange: "cluster",
  }),
});

@derivable(derive)
class _PgConnection {
  /**
   * Get the cluster name from the given `endpoint`.
   *
   * @param endpoint RPC endpoint
   * @returns the cluster name
   */
  static async getCluster(
    endpoint: string = PgConnection.current.rpcEndpoint
  ): Promise<Cluster> {
    // Local

    return "testnet";
  }

  /**
   * Create a connection with the given options or defaults from settings.
   *
   * @param opts connection options
   * @returns a new `Connection` instance
   */
  static create(opts?: { endpoint?: string } & ConnectionConfig) {
    return new ConnectionAElf(opts?.endpoint);
  }

  /**
   * Get whether the connection is ready to be used.
   *
   * If the endpoint is `Endpoint.PLAYNET` this will return `false` until the
   * connection gets overridden. This helps avoid sending unnecessary RPC requests
   * at start before the `connection` and `fetch` is overridden.
   *
   * This will always return `true` if the endpoint is not `Endpoint.PLAYNET`.
   *
   * @param conn overridable web3.js `Connection`
   * @returns whether the connection is ready to be used
   */
  static isReady() {
    return true;
  }

  /**
   * Get whether there is a successful connection to the current endpoint.
   *
   * @returns whether there is a successful connection
   */
  static async getIsConnected() {
    try {
      await PgConnection.current.getSlot();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get whether the current cluster is down by comparing the latest slot
   * numbers between a certain time period.
   *
   * @returns whether the current cluster is down
   */
  static async getIsClusterDown() {
    let prevSlot: number;
    try {
      prevSlot = await PgConnection.current.getSlot();
    } catch {
      return null;
    }

    // Sleep to give time for the RPC to advance slots
    await PgCommon.sleep(1000);

    let nextSlot: number;
    try {
      nextSlot = await PgConnection.current.getSlot();
    } catch {
      return null;
    }

    return prevSlot === nextSlot;
  }
}

export const PgConnection = declareDerivable(_PgConnection, derive);
