import { isWalletUserDecline, walletSupportsTransaction } from "../walletCapabilities";

describe("walletSupportsTransaction", () => {
  const legacy = {};
  const v0 = { version: 0 as const };

  it("legacy-only wallets accept legacy transactions", () => {
    expect(walletSupportsTransaction(["legacy"], legacy)).toBe(true);
    expect(walletSupportsTransaction(["legacy"], v0)).toBe(false);
  });

  it("v0-capable wallets accept versioned transactions", () => {
    expect(walletSupportsTransaction(["legacy", 0], legacy)).toBe(true);
    expect(walletSupportsTransaction(["legacy", 0], v0)).toBe(true);
  });
});

describe("isWalletUserDecline", () => {
  it("recognises MWA NOT_SIGNED", () => {
    expect(isWalletUserDecline(Object.assign(new Error("x"), { code: -3 }))).toBe(true);
  });
});