// The safety card: what Iris shows in AR (or flat, when the phone has no AR).
// Read-only. Every value comes from the app's own state or one balance read;
// when a value is not known, the card says UNKNOWN and why, never a guess.

import type { Network } from "../config/network";
import { shortAddress } from "./address";
import { displaySol } from "./amount";
import { relativeTime, type TxSummary } from "./history";

export type BalanceState = { kind: "loading" } | { kind: "ok"; lamports: bigint } | { kind: "error"; message: string };

export type ActivityState = { kind: "loading" } | { kind: "ok"; items: TxSummary[]; nowSec: number } | { kind: "error"; message: string };

export type SafetyCardInput = {
  network: Network;
  /** base58 address of the connected wallet, or null when none is connected */
  address: string | null;
  /** null when there is no wallet to read */
  balance: BalanceState | null;
  /** the wallet's latest transactions; null when there is no wallet to read */
  activity?: ActivityState | null;
};

export type SafetyFact = { label: string; value: string };

export type SafetyCard = {
  title: string;
  facts: SafetyFact[];
  /** up to three lines: the latest transactions, or one UNKNOWN line with the reason */
  activity: string[];
  rules: string[];
  footer: string;
};

export const SAFETY_RULES: readonly string[] = [
  "Iris never asks for your seed phrase. Anyone who does is trying to take your wallet.",
  "Before you send, check the first 4 and last 4 characters of the address.",
  "Every send shows a confirm card and needs your approval in the wallet app.",
];

export const SAFETY_FOOTER = "Read-only. Camera only. Nothing is sent from this screen.";

function networkValue(network: Network): string {
  return network === "mainnet" ? "Mainnet (real SOL)" : "Devnet (test SOL)";
}

function balanceValue(network: Network, address: string | null, balance: BalanceState | null): string {
  if (!address || !balance) return "UNKNOWN (no wallet connected)";
  if (balance.kind === "loading") return "reading…";
  if (balance.kind === "error") return `UNKNOWN (could not read: ${balance.message})`;
  return `${displaySol(balance.lamports)} SOL on ${network}`;
}

export const ACTIVITY_LINES = 3;

function activityLine(tx: TxSummary, nowSec: number): string {
  const when = relativeTime(tx.blockTime, nowSec);
  if (tx.deltaLamports == null) return `change UNKNOWN · ${when}${tx.failed ? " · failed" : ""}`;
  const sign = tx.deltaLamports > BigInt(0) ? "+" : tx.deltaLamports < BigInt(0) ? "−" : "";
  const abs = tx.deltaLamports < BigInt(0) ? -tx.deltaLamports : tx.deltaLamports;
  return `${sign}${displaySol(abs)} SOL · ${when}${tx.failed ? " · failed" : ""}`;
}

function activityLines(address: string | null, activity: ActivityState | null | undefined): string[] {
  if (!address || !activity) return ["Recent activity UNKNOWN (no wallet connected)"];
  if (activity.kind === "loading") return ["Recent activity: reading…"];
  if (activity.kind === "error") return [`Recent activity UNKNOWN (could not read: ${activity.message})`];
  if (activity.items.length === 0) return ["No transactions yet on this network"];
  return activity.items.slice(0, ACTIVITY_LINES).map((tx) => activityLine(tx, activity.nowSec));
}

export function buildSafetyCard({ network, address, balance, activity }: SafetyCardInput): SafetyCard {
  return {
    title: "Iris safety card",
    facts: [
      { label: "Network", value: networkValue(network) },
      { label: "Wallet", value: address ? shortAddress(address) : "Not connected" },
      { label: "Balance", value: balanceValue(network, address, balance) },
    ],
    activity: activityLines(address, activity),
    rules: [...SAFETY_RULES],
    footer: SAFETY_FOOTER,
  };
}

/** One line per fact, "Label · value", as the AR card and the screen reader show them. */
export function factLines(card: SafetyCard): string[] {
  return card.facts.map((f) => `${f.label} · ${f.value}`);
}

export type ArAvailability =
  | { kind: "checking" }
  | { kind: "ar" }
  | { kind: "flat"; reason: string };

/**
 * Whether to draw the card in AR. `viroLinked` is false when the AR engine
 * was not registered in this build (it ships for ARM phones only, so an x86
 * emulator gets the flat card). `arcore` is the phone's ARCore answer:
 * "SUPPORTED", another status string, or null while still asking.
 */
export function arAvailability(viroLinked: boolean, arcore: string | null): ArAvailability {
  if (!viroLinked) return { kind: "flat", reason: "This phone's processor has no AR engine in Iris (AR needs an ARM phone), so the card is shown flat." };
  if (arcore === null) return { kind: "checking" };
  if (arcore === "SUPPORTED") return { kind: "ar" };
  return { kind: "flat", reason: `ARCore is not available on this phone (${arcore}), so the card is shown flat.` };
}
