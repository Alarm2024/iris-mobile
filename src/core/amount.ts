// SOL <-> lamports with BigInt, so 0.1 + 0.2 never reaches a transaction.

export const LAMPORTS_PER_SOL = BigInt(1000000000);
const DECIMALS = 9;

/** "0.01" -> 10000000n. Throws on anything that is not a plain decimal with at most 9 places. */
export function solToLamports(decimal: string): bigint {
  const s = decimal.trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`not an amount: ${decimal}`);
  const [whole, frac = ""] = s.split(".");
  if (frac.length > DECIMALS) throw new Error("SOL has at most 9 decimal places");
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(frac.padEnd(DECIMALS, "0"));
}

/** 10000000n -> "0.01"; 1500000000n -> "1.5"; 5000n -> "0.000005". */
export function lamportsToSol(lamports: bigint): string {
  const neg = lamports < BigInt(0);
  const abs = neg ? -lamports : lamports;
  const whole = abs / LAMPORTS_PER_SOL;
  const frac = (abs % LAMPORTS_PER_SOL).toString().padStart(DECIMALS, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole.toString()}${frac ? "." + frac : ""}`;
}

/** For the screen and the voice: at most `places` decimals, rounded down, never "0" for a non-zero balance. */
export function displaySol(lamports: bigint, places = 4): string {
  const exact = lamportsToSol(lamports);
  const [w, f = ""] = exact.replace("-", "").split(".");
  if (f.length <= places) return exact;
  const cut = f.slice(0, places).replace(/0+$/, "");
  if (!cut && w === "0") return `${lamports < BigInt(0) ? "-" : ""}<0.${"0".repeat(places - 1)}1`;
  return `${lamports < BigInt(0) ? "-" : ""}${w}${cut ? "." + cut : ""}`;
}
