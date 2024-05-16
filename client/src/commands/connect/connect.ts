import { PgTerminal, PgView, PgWallet } from "../../utils/pg";
import { createCmd } from "../create";

export const connect = createCmd({
  name: "connect",
  description: "Toggle connection to Playground Wallet",
  run: async (input) => {
    switch (PgWallet.state) {
      case "pg": {
        PgWallet.state = "disconnected";
        PgTerminal.log(PgTerminal.bold("Disconnected."));

        break;
      }

      case "disconnected": {
        PgWallet.state = "pg";
        PgTerminal.log(PgTerminal.success("Connected."));

        break;
      }

      case "setup": {
        const { Setup } = await import("../../components/Wallet/Modals/Setup");
        const setupCompleted = await PgView.setModal(Setup);
        if (setupCompleted) {
          PgWallet.state = "pg";

          PgTerminal.log(PgTerminal.success("Setup completed."));
        } else {
          PgTerminal.log(PgTerminal.error("Setup rejected."));
        }
      }
    }
  },
});
