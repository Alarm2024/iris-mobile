import { checkSend, resolveRecipient } from "../planSend";

const ME = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const ALICE = "So11111111111111111111111111111111111111112";
const FEE = BigInt(5000);
const contacts = [{ name: "Alice", address: ALICE }];

describe("who to send to", () => {
  it("resolves a contact, the clipboard and a typed address", () => {
    expect(resolveRecipient({ type: "contact", name: "alice" }, contacts, null)).toEqual({ address: ALICE, label: "Alice" });
    expect(resolveRecipient({ type: "clipboard" }, contacts, `  ${ALICE}\n`)).toEqual({ address: ALICE, label: ALICE });
    expect(resolveRecipient({ type: "address", address: ALICE }, contacts, null)).toEqual({ address: ALICE, label: ALICE });
  });
  it("explains instead of guessing", () => {
    expect(resolveRecipient({ type: "clipboard" }, contacts, "hello")).toHaveProperty("problem");
    expect(resolveRecipient({ type: "contact", name: "zed" }, contacts, null)).toHaveProperty("problem");
    expect(resolveRecipient({ type: "domain", name: "toly.sol" }, contacts, null)).toHaveProperty("problem");
    expect(resolveRecipient({ type: "missing" }, contacts, null)).toHaveProperty("problem");
  });
});

describe("before the card", () => {
  const ONE_SOL = BigInt(1_000_000_000);
  it("accepts a covered send, in exact lamports", () => {
    expect(checkSend("0.01", ALICE, ME, ONE_SOL, FEE)).toEqual({ ok: true, lamports: BigInt(10_000_000), to: ALICE });
  });
  it("refuses what the balance plus fee can't cover", () => {
    const r = checkSend("1", ALICE, ME, ONE_SOL, FEE);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reply.text).toMatch(/not enough/);
  });
  it("refuses zero, nonsense amounts, bad addresses and self-sends", () => {
    expect(checkSend("0", ALICE, ME, ONE_SOL, FEE).ok).toBe(false);
    expect(checkSend("0.0000000001", ALICE, ME, ONE_SOL, FEE).ok).toBe(false);
    expect(checkSend("0.01", "not-an-address", ME, ONE_SOL, FEE).ok).toBe(false);
    expect(checkSend("0.01", ME, ME, ONE_SOL, FEE).ok).toBe(false);
  });
});
