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

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function decodeBase58(s: string): Uint8Array | null {
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes: number[] = []; // little-endian
  for (const ch of s) {
    let carry = ALPHABET.indexOf(ch);
    if (carry < 0) return null;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return Uint8Array.from([...new Array<number>(zeros).fill(0), ...bytes.reverse()]);
}

export function encodeBase58(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = []; // little-endian base 58
  for (const b of bytes) {
    let carry = b;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => ALPHABET[d]).join("");
}

/** A Solana address: base58 that decodes to exactly 32 bytes and re-encodes to itself. */
export function isValidAddress(address: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false;
  const bytes = decodeBase58(address);
  return !!bytes && bytes.length === 32 && encodeBase58(bytes) === address;
}
