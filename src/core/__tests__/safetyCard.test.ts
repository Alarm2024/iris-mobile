import { arAvailability, buildSafetyCard, factLines, SAFETY_FOOTER, SAFETY_RULES } from "../safetyCard";

const ADDRESS = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

describe("safety card", () => {
  it("shows the network, the short address and the balance on devnet", () => {
    const card = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: { kind: "ok", lamports: BigInt(1_500_000_000) } });
    expect(card.title).toBe("Iris safety card");
    expect(factLines(card)).toEqual(["Network · Devnet (test SOL)", "Wallet · 9xQe…VFin", "Balance · 1.5 SOL on devnet"]);
    expect(card.rules).toEqual(SAFETY_RULES);
    expect(card.footer).toBe(SAFETY_FOOTER);
  });

  it("says mainnet means real SOL", () => {
    const card = buildSafetyCard({ network: "mainnet", address: ADDRESS, balance: { kind: "ok", lamports: BigInt(0) } });
    expect(card.facts[0].value).toBe("Mainnet (real SOL)");
    expect(card.facts[2].value).toBe("0 SOL on mainnet");
  });

  it("says UNKNOWN with the reason instead of guessing a balance", () => {
    expect(buildSafetyCard({ network: "devnet", address: null, balance: null }).facts.slice(1)).toEqual([
      { label: "Wallet", value: "Not connected" },
      { label: "Balance", value: "UNKNOWN (no wallet connected)" },
    ]);
    const failed = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: { kind: "error", message: "network request failed" } });
    expect(failed.facts[2].value).toBe("UNKNOWN (could not read: network request failed)");
    const loading = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: { kind: "loading" } });
    expect(loading.facts[2].value).toBe("reading…");
  });

  it("never prints a seed-phrase prompt, only the warning", () => {
    const text = JSON.stringify(buildSafetyCard({ network: "devnet", address: ADDRESS, balance: { kind: "loading" } }));
    expect(text).toContain("never asks for your seed phrase");
    expect(text).not.toMatch(/enter (your )?(seed|recovery) phrase/i);
  });
});

describe("recent activity", () => {
  const now = 1_760_000_000;
  const tx = (deltaLamports: bigint | null, ago: number, failed = false) => ({ signature: `s${ago}`, blockTime: now - ago, deltaLamports, failed });

  it("lists at most three, newest first as given, with sign and time", () => {
    const card = buildSafetyCard({
      network: "devnet",
      address: ADDRESS,
      balance: { kind: "ok", lamports: BigInt(1) },
      activity: { kind: "ok", nowSec: now, items: [tx(BigInt(500_000_000), 30), tx(BigInt(-10_005_000), 7200, false), tx(null, 90_000), tx(BigInt(1), 999_999)] },
    });
    expect(card.activity).toEqual(["+0.5 SOL · just now", "−0.01 SOL · 2 hours ago", "change UNKNOWN · yesterday"]);
  });

  it("marks failed transactions and says when there are none", () => {
    const failed = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: null, activity: { kind: "ok", nowSec: now, items: [tx(BigInt(-5000), 120, true)] } });
    expect(failed.activity).toEqual(["−<0.0001 SOL · 2 minutes ago · failed"]);
    const none = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: null, activity: { kind: "ok", nowSec: now, items: [] } });
    expect(none.activity).toEqual(["No transactions yet on this network"]);
  });

  it("says UNKNOWN with the reason when it cannot read", () => {
    expect(buildSafetyCard({ network: "devnet", address: null, balance: null }).activity).toEqual(["Recent activity UNKNOWN (no wallet connected)"]);
    const err = buildSafetyCard({ network: "devnet", address: ADDRESS, balance: null, activity: { kind: "error", message: "429" } });
    expect(err.activity).toEqual(["Recent activity UNKNOWN (could not read: 429)"]);
  });
});

describe("AR or flat", () => {
  it("is flat, with a reason, when the AR engine is not in this build", () => {
    const a = arAvailability(false, null);
    expect(a.kind).toBe("flat");
    expect(a.kind === "flat" && a.reason).toMatch(/ARM phone/);
  });
  it("waits for ARCore, then uses AR only when it says SUPPORTED", () => {
    expect(arAvailability(true, null)).toEqual({ kind: "checking" });
    expect(arAvailability(true, "SUPPORTED")).toEqual({ kind: "ar" });
    const b = arAvailability(true, "UNSUPPORTED");
    expect(b.kind === "flat" && b.reason).toContain("(UNSUPPORTED)");
  });
});
