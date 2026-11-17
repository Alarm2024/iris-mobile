import type { SolanaTransactionVersion } from "@solana/wallet-standard-features";

/** MWA `ERROR_NOT_SIGNED` — user declined or did not finish signing. */
const ERROR_NOT_SIGNED = -3;

export type TxVersionCheckable = Readonly<{ version?: number | "legacy" }>;

export function walletSupportsTransaction(
  versions: ReadonlyArray<SolanaTransactionVersion>,
  transaction: TxVersionCheckable,
): boolean {
  const supportsLegacy = versions.includes("legacy");
  const supportsV0 = versions.includes(0);
  if (transaction.version === undefined) {
    return supportsLegacy;
  }
  if (transaction.version === "legacy") {
    return supportsLegacy;
  }
  if (transaction.version === 0) {
    return supportsV0;
  }
  return versions.includes(transaction.version as SolanaTransactionVersion);
}

export function isWalletUserDecline(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === ERROR_NOT_SIGNED) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /declin|reject|not signed/i.test(msg);
}