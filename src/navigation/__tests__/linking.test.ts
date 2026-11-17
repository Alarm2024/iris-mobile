import {
  isAllowedDeepLinkPath,
  isAllowedDeepLinkUrl,
  linking,
  normalizeDeepLinkPath,
  pathFromDeepLinkUrl,
} from "../linking";

describe("deep link whitelist", () => {
  it("allows only Voice and Settings paths", () => {
    expect(isAllowedDeepLinkPath("")).toBe(true);
    expect(isAllowedDeepLinkPath("settings")).toBe(true);
    expect(isAllowedDeepLinkPath("/settings")).toBe(true);
    expect(isAllowedDeepLinkPath("Settings")).toBe(true);
  });

  it("rejects wallet authorize/sign and other unknown paths", () => {
    expect(isAllowedDeepLinkPath("wallet/sign")).toBe(false);
    expect(isAllowedDeepLinkPath("wallet/authorize")).toBe(false);
    expect(isAllowedDeepLinkPath("sign")).toBe(false);
    expect(isAllowedDeepLinkPath("authorize")).toBe(false);
    expect(isAllowedDeepLinkPath("voice")).toBe(false);
  });

  it("parses irisdeskvoice:// URLs the same way as Linking", () => {
    expect(pathFromDeepLinkUrl("irisdeskvoice://")).toBe("");
    expect(pathFromDeepLinkUrl("irisdeskvoice://settings")).toBe("settings");
    expect(pathFromDeepLinkUrl("irisdeskvoice://wallet/sign")).toBe("wallet/sign");
    expect(normalizeDeepLinkPath("wallet/sign?x=1#y")).toBe("wallet/sign");
  });

  it("filter allows Voice/Settings URLs only", () => {
    expect(isAllowedDeepLinkUrl("irisdeskvoice://")).toBe(true);
    expect(isAllowedDeepLinkUrl("irisdeskvoice://settings")).toBe(true);
    expect(isAllowedDeepLinkUrl("irisdeskvoice://wallet/sign")).toBe(false);
    expect(linking.filter!("irisdeskvoice://wallet/sign")).toBe(false);
    expect(linking.filter!("irisdeskvoice://settings")).toBe(true);
  });

  it("getStateFromPath returns undefined for irisdeskvoice://wallet/sign", () => {
    const state = linking.getStateFromPath!("wallet/sign", linking.config);
    expect(state).toBeUndefined();
  });

  it("getStateFromPath maps settings and empty path to stack screens", () => {
    const settings = linking.getStateFromPath!("settings", linking.config);
    expect(settings?.routes.map((r) => r.name)).toEqual(["Settings"]);

    const voice = linking.getStateFromPath!("", linking.config);
    expect(voice?.routes.map((r) => r.name)).toEqual(["Voice"]);
  });
});
