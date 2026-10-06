import { walletErrorMessage } from "../walletErrors";

const err = (code: unknown, message = "x") => Object.assign(new Error(message), { code });

describe("wallet errors", () => {
  it("names each Mobile Wallet Adapter outcome", () => {
    expect(walletErrorMessage(err("ERROR_WALLET_NOT_FOUND"))).toMatch(/Install Phantom or Solflare/);
    expect(walletErrorMessage(err(-1))).toMatch(/didn't authorize/);
    expect(walletErrorMessage(err(-3))).toBe("You declined in the wallet. Nothing was sent.");
    expect(walletErrorMessage(err(-4))).toMatch(/couldn't submit/);
    expect(walletErrorMessage(err("ERROR_SESSION_CLOSED"))).toMatch(/closed/);
  });
  it("falls back to the message, shortened", () => {
    expect(walletErrorMessage(new Error("User rejected the request"))).toMatch(/declined/);
    expect(walletErrorMessage(new Error("boom"))).toBe("That didn't go through: boom");
  });
});
