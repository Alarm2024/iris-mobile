// A parsed transaction -> what it did to one wallet, in lamports.

export type TxSummary = {
  signature: string;
  blockTime: number | null;
  /** Net change to the owner's SOL balance, fees included; null when the transaction could not be read. */
  deltaLamports: bigint | null;
  failed: boolean;
};

type KeyLike = { pubkey: { toBase58(): string } | string } | { toBase58(): string } | string;

export type ParsedLike = {
  meta: { err: unknown; preBalances: number[]; postBalances: number[] } | null;
  transaction: { message: { accountKeys: KeyLike[] } };
} | null;

function keyString(k: KeyLike): string {
  if (typeof k === "string") return k;
  if ("pubkey" in k) return typeof k.pubkey === "string" ? k.pubkey : k.pubkey.toBase58();
  return k.toBase58();
}

export function summarize(
  sig: { signature: string; blockTime?: number | null; err: unknown },
  tx: ParsedLike,
  owner: string,
): TxSummary {
  const base = { signature: sig.signature, blockTime: sig.blockTime ?? null, failed: sig.err != null };
  if (!tx || !tx.meta) return { ...base, deltaLamports: null };
  const i = tx.transaction.message.accountKeys.findIndex((k) => keyString(k) === owner);
  if (i < 0) return { ...base, deltaLamports: null };
  const pre = tx.meta.preBalances[i];
  const post = tx.meta.postBalances[i];
  if (pre === undefined || post === undefined) return { ...base, deltaLamports: null };
  return { ...base, deltaLamports: BigInt(post) - BigInt(pre), failed: tx.meta.err != null };
}

export function relativeTime(blockTime: number | null, nowSec: number): string {
  if (blockTime == null) return "time unknown";
  const s = Math.max(0, nowSec - blockTime);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} minutes ago`;
  if (s < 2 * 3600) return "an hour ago";
  if (s < 86400) return `${Math.round(s / 3600)} hours ago`;
  if (s < 2 * 86400) return "yesterday";
  return `${Math.round(s / 86400)} days ago`;
}
