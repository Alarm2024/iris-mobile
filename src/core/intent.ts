// Voice -> intent. Deterministic rules, no network and no model: the phrase a
// person says to move money must mean the same thing every time.

import { findAddress } from "./address";
import { findAmount } from "./numbers";

export type Token = "SOL" | "SKR";

export type Recipient =
  | { type: "address"; address: string }
  | { type: "contact"; name: string }
  | { type: "clipboard" }
  | { type: "domain"; name: string }
  | { type: "missing" };

export type Intent =
  | { kind: "balance"; token: Token }
  | { kind: "history"; limit: number }
  | { kind: "send"; amount: string; token: Token; recipient: Recipient }
  | { kind: "airdrop"; amount: string }
  | { kind: "address" }
  | { kind: "confirm" }
  | { kind: "cancel" }
  | { kind: "help" }
  | { kind: "unknown"; text: string; reason?: "no-amount" };

// What Android's recognizer writes for "SOL", observed and plausible.
const SOL_WORDS = new Set(["sol", "sols", "soul", "souls", "sole", "soles", "solana", "saul"]);
const SKR_WORDS = new Set(["skr", "seeker", "seekers", "sker", "skrs"]);
const FILLER = new Set(["my", "the", "please", "wallet", "account", "address", "now", "friend", "buddy", "contact", "for", "me"]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\$(?=\d)/g, "")
    // keep decimal points and commas that sit between digits; drop other punctuation
    .replace(/(\d)[.,](\d)/g, "$1\u0000$2")
    .replace(/[^a-z0-9\u0000'\s.]/g, " ")
    .replace(/\.(?=\s|$)/g, " ")
    .replace(/\u0000/g, ".")
    .split(/\s+/)
    .filter(Boolean);
}

function tokenIn(tokens: string[]): Token {
  if (tokens.some((t) => SKR_WORDS.has(t)) || /\bs k r\b/.test(tokens.join(" "))) return "SKR";
  return "SOL";
}

function wantsCount(tokens: string[]): number {
  const m = findAmount(tokens);
  const n = m ? Number(m.value) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 5;
}

function recipientFrom(original: string, tokens: string[], amountEnd: number): Recipient {
  const address = findAddress(original);
  if (address) return { type: "address", address };

  // "... to <who>": the last "to" after the amount.
  let at = -1;
  for (let i = tokens.length - 1; i >= amountEnd; i--) {
    if (tokens[i] === "to") { at = i; break; }
  }
  // "pay alice 0.5 sol" / "give bob 1 sol": the words between the verb and the amount.
  let words: string[] = [];
  if (at >= 0) {
    words = tokens.slice(at + 1);
  } else {
    const verb = tokens.findIndex((t) => t === "pay" || t === "give");
    const amount = findAmount(tokens);
    if (verb >= 0 && amount && amount.start > verb + 1) words = tokens.slice(verb + 1, amount.start);
  }
  // A .sol name, before "sol" is dropped as the token word: "toly dot sol".
  const kept = words.filter((w) => !FILLER.has(w));
  const domain = kept.join(" ").replace(/\s+dot\s+sol$/, ".sol").replace(/\s+/g, "");
  if (/^[a-z0-9-]+\.sol$/.test(domain)) return { type: "domain", name: domain };
  words = kept.filter((w) => !SOL_WORDS.has(w) && !SKR_WORDS.has(w));
  if (words.length === 0) return { type: "missing" };
  const phrase = words.join(" ");
  if (/\b(clipboard|copied|pasted|paste)\b/.test(phrase)) return { type: "clipboard" };
  return { type: "contact", name: phrase };
}

export function parseIntent(text: string): Intent {
  const tokens = tokenize(text);
  const joined = ` ${tokens.join(" ")} `;
  const has = (re: RegExp) => re.test(joined);

  if (tokens.length === 0) return { kind: "unknown", text };
  if (has(/^ (cancel|stop|never ?mind|abort|no|nope|don't)( |$)/)) return { kind: "cancel" };
  if (has(/^ (confirm|yes|yep|send it|do it|approve|go ahead)( |$)/)) return { kind: "confirm" };
  if (has(/ (help|what can you do|what do you do|commands) /)) return { kind: "help" };

  if (has(/ (send|transfer|pay|give) /)) {
    const amount = findAmount(tokens);
    if (!amount) return { kind: "unknown", text, reason: "no-amount" };
    return {
      kind: "send",
      amount: amount.value,
      token: tokenIn(tokens),
      recipient: recipientFrom(text, tokens, amount.end),
    };
  }
  if (has(/ airdrop /)) {
    const amount = findAmount(tokens);
    return { kind: "airdrop", amount: amount ? amount.value : "1" };
  }
  if (has(/ (transactions?|history|activity|recent|transfers) /)) {
    return { kind: "history", limit: wantsCount(tokens) };
  }
  if (has(/ (balance|how much|how many|funds|what do i have|what have i got) /)) {
    return { kind: "balance", token: tokenIn(tokens) };
  }
  if (has(/ (my address|wallet address|public key|who am i|my key) /)) return { kind: "address" };
  return { kind: "unknown", text };
}
