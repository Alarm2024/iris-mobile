// Everything Iris asks the chain. Reads go straight to the RPC; the only
// write is a SystemProgram transfer that the wallet app signs and sends.

import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { summarize, TxSummary } from "../core/history";

/** A plain transfer's fee: one signature. Used only to check the balance can cover it. */
export const TRANSFER_FEE_LAMPORTS = BigInt(5000);

export async function getBalanceLamports(connection: Connection, owner: PublicKey): Promise<bigint> {
  return BigInt(await connection.getBalance(owner, "confirmed"));
}

export async function getRecent(connection: Connection, owner: PublicKey, limit: number): Promise<TxSummary[]> {
  const sigs = await connection.getSignaturesForAddress(owner, { limit }, "confirmed");
  if (sigs.length === 0) return [];
  const txs = await connection.getParsedTransactions(
    sigs.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0, commitment: "confirmed" },
  );
  const me = owner.toBase58();
  return sigs.map((s, i) => summarize(s, txs[i] ?? null, me));
}

export async function buildTransfer(
  connection: Connection,
  from: PublicKey,
  to: PublicKey,
  lamports: bigint,
): Promise<{ tx: Transaction; minContextSlot: number; blockhash: string; lastValidBlockHeight: number }> {
  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await connection.getLatestBlockhashAndContext("confirmed");
  const tx = new Transaction({ feePayer: from, blockhash, lastValidBlockHeight }).add(
    SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports }),
  );
  return { tx, minContextSlot, blockhash, lastValidBlockHeight };
}

/** Devnet only — the caller checks the network. The faucet rate-limits hard. */
export async function requestAirdrop(connection: Connection, owner: PublicKey, lamports: bigint): Promise<string> {
  const sig = await connection.requestAirdrop(owner, Number(lamports));
  const latest = await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");
  return sig;
}
