import { Connection } from "@solana/web3.js";
import { createContext, ReactNode, useContext, useMemo } from "react";
import { NETWORKS } from "../config/network";
import { useSettings } from "../state/settings";

const ConnectionContext = createContext<{ connection: Connection } | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const connection = useMemo(() => new Connection(NETWORKS[settings.network].endpoint, "confirmed"), [settings.network]);
  return <ConnectionContext.Provider value={{ connection }}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): Connection {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection outside ConnectionProvider");
  return ctx.connection;
}
