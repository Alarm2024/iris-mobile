import { parseIntent } from "../intent";

const ADDR = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

describe("intents", () => {
  it("balance", () => {
    for (const s of ["What's my balance?", "how much sol do I have", "balance", "check my funds"]) {
      expect(parseIntent(s)).toEqual({ kind: "balance", token: "SOL" });
    }
    expect(parseIntent("what's my SKR balance")).toEqual({ kind: "balance", token: "SKR" });
  });
  it("history", () => {
    expect(parseIntent("Show my last transactions")).toEqual({ kind: "history", limit: 5 });
    expect(parseIntent("show my last three transactions")).toEqual({ kind: "history", limit: 3 });
    expect(parseIntent("recent activity")).toEqual({ kind: "history", limit: 5 });
  });
  it("send to a contact", () => {
    expect(parseIntent("Send 0.01 SOL to Alice")).toEqual({
      kind: "send", amount: "0.01", token: "SOL", recipient: { type: "contact", name: "alice" },
    });
    expect(parseIntent("send point zero one soul to my friend bob please")).toEqual({
      kind: "send", amount: "0.01", token: "SOL", recipient: { type: "contact", name: "bob" },
    });
    expect(parseIntent("pay alice 0.5 sol")).toMatchObject({ amount: "0.5", recipient: { type: "contact", name: "alice" } });
    expect(parseIntent("transfer 2 to mom")).toMatchObject({ amount: "2", recipient: { type: "contact", name: "mom" } });
  });
  it("send to a typed or pasted address keeps its case", () => {
    expect(parseIntent(`send 0.01 SOL to ${ADDR}`)).toEqual({
      kind: "send", amount: "0.01", token: "SOL", recipient: { type: "address", address: ADDR },
    });
  });
  it("send to the clipboard and to a .sol name", () => {
    expect(parseIntent("send 0.01 sol to the copied address")).toMatchObject({ recipient: { type: "clipboard" } });
    expect(parseIntent("send 0.01 sol to clipboard")).toMatchObject({ recipient: { type: "clipboard" } });
    expect(parseIntent("send 1 sol to toly dot sol")).toMatchObject({ recipient: { type: "domain", name: "toly.sol" } });
  });
  it("send without an amount or recipient says so", () => {
    expect(parseIntent("send sol to alice")).toEqual({ kind: "unknown", text: "send sol to alice", reason: "no-amount" });
    expect(parseIntent("send 0.01 sol")).toMatchObject({ kind: "send", recipient: { type: "missing" } });
  });
  it("SKR is recognised, not confused with SOL", () => {
    expect(parseIntent("send 10 seeker to alice")).toMatchObject({ token: "SKR", amount: "10" });
  });
  it("confirm, cancel, help, address, airdrop", () => {
    expect(parseIntent("Confirm")).toEqual({ kind: "confirm" });
    expect(parseIntent("yes send it")).toEqual({ kind: "confirm" });
    expect(parseIntent("cancel")).toEqual({ kind: "cancel" });
    expect(parseIntent("no, never mind")).toEqual({ kind: "cancel" });
    expect(parseIntent("help")).toEqual({ kind: "help" });
    expect(parseIntent("what's my wallet address")).toEqual({ kind: "address" });
    expect(parseIntent("airdrop 2 sol")).toEqual({ kind: "airdrop", amount: "2" });
    expect(parseIntent("request an airdrop")).toEqual({ kind: "airdrop", amount: "1" });
  });
  it("anything else is unknown", () => {
    expect(parseIntent("tell me a joke")).toEqual({ kind: "unknown", text: "tell me a joke" });
    expect(parseIntent("")).toEqual({ kind: "unknown", text: "" });
  });
});
