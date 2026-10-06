export type Network = "devnet" | "mainnet";

export const NETWORKS: Record<Network, { label: string; endpoint: string; chain: `solana:${string}`; explorerQuery: string }> = {
  devnet: {
    label: "Devnet",
    endpoint: "https://api.devnet.solana.com",
    chain: "solana:devnet",
    explorerQuery: "?cluster=devnet",
  },
  mainnet: {
    label: "Mainnet",
    endpoint: "https://api.mainnet-beta.solana.com",
    chain: "solana:mainnet",
    explorerQuery: "",
  },
};

export function explorerTxUrl(signature: string, network: Network): string {
  return `https://explorer.solana.com/tx/${signature}${NETWORKS[network].explorerQuery}`;
}

export function explorerAddressUrl(address: string, network: Network): string {
  return `https://explorer.solana.com/address/${address}${NETWORKS[network].explorerQuery}`;
}
