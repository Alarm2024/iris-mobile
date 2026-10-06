// Saved names -> addresses. Speaking 44 base58 characters is not a real
// workflow, so "send 0.01 SOL to Alice" is resolved against this list.

export type Contact = { name: string; address: string };

export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

export type Match =
  | { kind: "one"; contact: Contact }
  | { kind: "many"; contacts: Contact[] }
  | { kind: "none" };

/** Exact name first, then one that sounds close (one or two letters off). Never guesses between two. */
export function matchContact(contacts: Contact[], spoken: string): Match {
  const want = normalizeName(spoken);
  if (!want) return { kind: "none" };
  const exact = contacts.filter((c) => normalizeName(c.name) === want);
  if (exact.length === 1) return { kind: "one", contact: exact[0] };
  if (exact.length > 1) return { kind: "many", contacts: exact };
  const limit = want.length <= 4 ? 1 : 2;
  const near = contacts
    .map((c) => ({ c, d: distance(normalizeName(c.name), want) }))
    .filter(({ d }) => d <= limit)
    .sort((x, y) => x.d - y.d);
  if (near.length === 0) return { kind: "none" };
  if (near.length > 1 && near[0].d === near[1].d) return { kind: "many", contacts: near.filter((n) => n.d === near[0].d).map((n) => n.c) };
  return { kind: "one", contact: near[0].c };
}
