// Spoken and written amounts -> an exact decimal string ("0.01"), never a float.
//
// Android's recognizer usually writes digits ("send 0.01 SOL"), but it does
// not always: "point zero one", "one and a half" and "half a sol" all come
// back as words. Both shapes are read here, and the result stays a string so
// lamports can be computed exactly.

const SMALL: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const DIGIT: Record<string, string> = {
  zero: "0", oh: "0", o: "0", one: "1", two: "2", three: "3", four: "4",
  five: "5", six: "6", seven: "7", eight: "8", nine: "9",
};
const FRACTION: Record<string, string> = { half: "5", quarter: "25", tenth: "1" };

export type AmountMatch = { value: string; start: number; end: number };

const DIGITS_RE = /^\d*[.,]?\d+$/;

function cleanDecimal(intPart: string, frac: string): string {
  const i = intPart.replace(/^0+(?=\d)/, "") || "0";
  const f = frac.replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

/** Read an amount that starts exactly at `tokens[at]`, or return null. */
function readAt(tokens: string[], at: number): AmountMatch | null {
  const t = tokens[at];
  if (DIGITS_RE.test(t)) {
    const [i, f = ""] = t.replace(",", ".").split(".");
    return { value: cleanDecimal(i, f), start: at, end: at + 1 };
  }
  // "half a sol", "a quarter sol", "a tenth of a sol"
  let k = at;
  if (tokens[k] === "a" && FRACTION[tokens[k + 1]]) k += 1;
  if (FRACTION[tokens[k]] && (k === at || tokens[at] === "a")) {
    return { value: `0.${FRACTION[tokens[k]]}`, start: at, end: k + 1 };
  }

  let total = 0;
  let current = 0;
  let sawInt = false;
  let i = at;
  for (; i < tokens.length; i++) {
    const w = tokens[i];
    if (w in SMALL) { current += SMALL[w]; sawInt = true; }
    else if (w in TENS) { current += TENS[w]; sawInt = true; }
    else if (w === "hundred" && sawInt) { current *= 100; }
    else if (w === "thousand" && sawInt) { total += current * 1000; current = 0; }
    else if (w === "and" && sawInt && tokens[i + 1] === "a" && FRACTION[tokens[i + 2]]) {
      return { value: cleanDecimal(String(total + current), FRACTION[tokens[i + 2]]), start: at, end: i + 3 };
    } else break;
  }
  let frac = "";
  if (tokens[i] === "point" || tokens[i] === "dot") {
    let j = i + 1;
    while (j < tokens.length && tokens[j] in DIGIT) { frac += DIGIT[tokens[j]]; j++; }
    if (frac) return { value: cleanDecimal(String(total + current), frac), start: at, end: j };
  }
  if (!sawInt) return null;
  return { value: cleanDecimal(String(total + current), ""), start: at, end: i };
}

/** The first amount anywhere in `tokens`. */
export function findAmount(tokens: string[]): AmountMatch | null {
  for (let at = 0; at < tokens.length; at++) {
    const m = readAt(tokens, at);
    if (m) return m;
  }
  return null;
}
