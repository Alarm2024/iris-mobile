// What Iris says and shows. Plain, short, and never a claim about money it
// cannot see: balances and transfers only, read from the chain.

import { displaySol, lamportsToSol } from "./amount";
import { relativeTime, TxSummary } from "./history";
import { shortAddress, spokenAddressTail } from "./address";
import type { Network } from "../config/network";

export type Reply = { text: string; speech: string };

const NET: Record<Network, string> = { devnet: "devnet", mainnet: "mainnet" };

export function balanceReply(lamports: bigint, network: Network): Reply {
  const sol = displaySol(lamports);
  return { text: `You have ${sol} SOL on ${NET[network]}.`, speech: `You have ${spokenSol(sol)} on ${NET[network]}.` };
}

export function spokenSol(sol: string): string {
  if (sol.startsWith("<")) return "less than 0.0001 SOL";
  return sol === "1" ? "1 SOL" : `${sol} SOL`;
}

export function historyReply(items: TxSummary[], network: Network, nowSec: number): Reply {
  if (items.length === 0) {
    return { text: `No transactions yet on ${NET[network]}.`, speech: `I don't see any transactions on ${NET[network]} yet.` };
  }
  const line = (t: TxSummary) => {
    const when = relativeTime(t.blockTime, nowSec);
    if (t.failed) return `failed transaction, ${when}`;
    if (t.deltaLamports == null) return `transaction ${when}`;
    const amt = displaySol(t.deltaLamports < BigInt(0) ? -t.deltaLamports : t.deltaLamports);
    if (t.deltaLamports === BigInt(0)) return `no SOL change, ${when}`;
    return `${t.deltaLamports < BigInt(0) ? "sent" : "received"} ${amt} SOL, ${when}`;
  };
  const lines = items.map(line);
  const n = items.length;
  return {
    text: `Last ${n} transaction${n === 1 ? "" : "s"} on ${NET[network]}:\n` + lines.map((l) => `• ${l}`).join("\n"),
    speech: `Your last ${n === 1 ? "transaction" : `${n} transactions`}: ${lines.join("; ")}.`,
  };
}

export function sendPreviewReply(lamports: bigint, label: string, address: string, network: Network): Reply {
  const sol = lamportsToSol(lamports);
  const who = label === address ? shortAddress(address) : `${label} (${shortAddress(address)})`;
  const spokenWho = label === address ? `the address ending in ${spokenAddressTail(address)}` : label;
  return {
    text: `Ready to send ${sol} SOL to ${who} on ${NET[network]}. Check the card, then tap Confirm.`,
    speech: `Ready to send ${spokenSol(sol)} to ${spokenWho} on ${NET[network]}. Check the card, then tap confirm and approve in your wallet.`,
  };
}

export const HELP: Reply = {
  text:
    "Try:\n• “What's my balance?”\n• “Show my last transactions”\n• “Send 0.01 SOL to Alice” (a saved contact)\n• “Send 0.01 SOL to clipboard” (a copied address)\n• “Airdrop 1 SOL” (devnet)\nEvery send shows a card first and is signed in your wallet app.",
  speech:
    "You can ask for your balance, your last transactions, or say: send 0.01 SOL to a saved contact. Every send shows a card first, and your wallet signs it.",
};

export function say(text: string, speech?: string): Reply {
  return { text, speech: speech ?? text };
}
