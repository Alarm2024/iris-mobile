import { userCommandFromText } from "../commandText";
import { checkSend, resolveRecipient } from "../../core/planSend";

const ME = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const ALICE_ADDR = "So11111111111111111111111111111111111111112";
const FEE = BigInt(5000);
const contacts = [{ name: "Alice", address: ALICE_ADDR }];

describe("typed commands", () => {
  it("uses the same intent parser as voice and reaches the confirm-card send path", () => {
    const balance = userCommandFromText("What's my balance?");
    expect(balance).toEqual({ text: "What's my balance?", intent: { kind: "balance", token: "SOL" } });

    const send = userCommandFromText("  Send 0.01 SOL to Alice  ");
    expect(send?.text).toBe("Send 0.01 SOL to Alice");
    expect(send?.intent.kind).toBe("send");
    if (send?.intent.kind !== "send") throw new Error("expected send intent");

    const who = resolveRecipient(send.intent.recipient, contacts, null);
    expect(who).toEqual({ address: ALICE_ADDR, label: "Alice" });
    if ("problem" in who) throw new Error("unexpected problem");

    const check = checkSend(send.intent.amount, who.address, ME, BigInt(2_000_000_000), FEE);
    expect(check.ok).toBe(true);
  });

  it("ignores empty typed input", () => {
    expect(userCommandFromText("   ")).toBeNull();
  });
});
