import { clearAuthOnMwaError } from "../clearAuthOnMwaError";

describe("clearAuthOnMwaError", () => {
  it("forgets the auth token when the MWA call fails", async () => {
    const forgetAuthorization = jest.fn(async () => {});
    await expect(
      clearAuthOnMwaError(forgetAuthorization, async () => {
        throw Object.assign(new Error("no wallet"), { code: "ERROR_WALLET_NOT_FOUND" });
      }),
    ).rejects.toMatchObject({ code: "ERROR_WALLET_NOT_FOUND" });
    expect(forgetAuthorization).toHaveBeenCalledTimes(1);
  });

  it("keeps the auth token when the MWA call succeeds", async () => {
    const forgetAuthorization = jest.fn(async () => {});
    await expect(clearAuthOnMwaError(forgetAuthorization, async () => "ok")).resolves.toBe("ok");
    expect(forgetAuthorization).not.toHaveBeenCalled();
  });
});
