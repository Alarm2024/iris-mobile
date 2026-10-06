import { relativeTime, summarize } from "../history";
import { historyReply, balanceReply, sendPreviewReply } from "../replies";

const OWNER = "Owner1111111111111111111111111111111111111";

describe("history", () => {
  const tx = (pre: number, post: number, err: unknown = null) => ({
    meta: { err, preBalances: [pre, 0], postBalances: [post, 0] },
    transaction: { message: { accountKeys: [{ pubkey: OWNER }, { pubkey: "Other" }] } },
  });
  it("summarizes the owner's net change", () => {
    expect(summarize({ signature: "s1", blockTime: 100, err: null }, tx(1_000_000_000, 989_995_000), OWNER).deltaLamports).toBe(BigInt(-10_005_000));
    expect(summarize({ signature: "s2", blockTime: 100, err: null }, tx(0, 500_000_000), OWNER).deltaLamports).toBe(BigInt(500_000_000));
    expect(summarize({ signature: "s3", blockTime: null, err: null }, null, OWNER).deltaLamports).toBeNull();
    expect(summarize({ signature: "s4", blockTime: 1, err: { x: 1 } }, tx(5, 0, { x: 1 }), OWNER).failed).toBe(true);
  });
  it("says when, in words", () => {
    expect(relativeTime(1000, 1030)).toBe("just now");
    expect(relativeTime(0, 1800)).toBe("30 minutes ago");
    expect(relativeTime(0, 100000)).toBe("yesterday");
    expect(relativeTime(null, 5)).toBe("time unknown");
  });
  it("speaks a short summary", () => {
    const r = historyReply(
      [
        { signature: "a", blockTime: 0, deltaLamports: BigInt(500_000_000), failed: false },
        { signature: "b", blockTime: 0, deltaLamports: BigInt(-10_005_000), failed: false },
      ],
      "devnet",
      100000,
    );
    expect(r.speech).toBe("Your last 2 transactions: received 0.5 SOL, yesterday; sent 0.01 SOL, yesterday.");
    expect(historyReply([], "devnet", 0).text).toBe("No transactions yet on devnet.");
  });
  it("balance and send preview replies", () => {
    expect(balanceReply(BigInt(1_250_000_000), "devnet").text).toBe("You have 1.25 SOL on devnet.");
    const p = sendPreviewReply(BigInt(10_000_000), "Alice", OWNER, "devnet");
    expect(p.text).toContain("0.01 SOL to Alice (Owne…1111) on devnet");
    expect(p.speech).toContain("to Alice on devnet");
  });
});
