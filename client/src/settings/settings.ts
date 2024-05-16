import { automaticAirdrop } from "./automatic-airdrop";
import { blockExplorer } from "./block-explorer";
import { endpoint } from "./endpoint";
import { font } from "./font";
import { showTransactionDetails } from "./show-transaction-details";
import { showTransactionNotifications } from "./show-transaction-notifications";
import { theme } from "./theme";

/** All configurable settings */
export const SETTINGS = [
  theme,
  font,
  endpoint,
  blockExplorer,
  automaticAirdrop,
  showTransactionDetails,
  showTransactionNotifications,
];
