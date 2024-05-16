import { PgWallet } from "../utils/pg";
import { useRenderOnChange } from "./useRenderOnChange";

export const useWallet = () => {
  useRenderOnChange(PgWallet.onDidChangeCurrent);

  const walletPkStr = PgWallet.current?.wallet.address || "";

  return {
    wallet: PgWallet.current,
    walletPkStr,
  };
};
