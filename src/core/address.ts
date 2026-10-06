// Base58 Solana addresses: found in typed or pasted text, shortened for speech.

export const BASE58_ADDRESS_RE = /[1-9A-HJ-NP-Za-km-z]{32,44}/;

export function findAddress(text: string): string | null {
  const m = text.match(new RegExp(`(?:^|[^1-9A-HJ-NP-Za-km-z])(${BASE58_ADDRESS_RE.source})(?![1-9A-HJ-NP-Za-km-z])`));
  return m ? m[1] : null;
}

export function shortAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

/** "ending in 9 F Q a" — what Iris says instead of reading 44 characters aloud. */
export function spokenAddressTail(address: string): string {
  return address.slice(-4).split("").map((c) => (/[A-Z]/.test(c) ? `capital ${c}` : c)).join(" ");
}
