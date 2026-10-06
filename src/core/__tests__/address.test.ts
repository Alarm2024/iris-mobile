import { decodeBase58, encodeBase58, findAddress, isValidAddress, shortAddress } from "../address";

describe("addresses", () => {
  it("accepts real 32-byte addresses", () => {
    expect(isValidAddress("So11111111111111111111111111111111111111112")).toBe(true);
    expect(isValidAddress("11111111111111111111111111111111")).toBe(true);
    expect(isValidAddress("9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin")).toBe(true);
  });
  it("refuses wrong lengths, bad characters and non-canonical forms", () => {
    expect(isValidAddress("So1111111111111111111111111111111111111111")).toBe(false); // 31 bytes
    expect(isValidAddress("0OIl1111111111111111111111111111111")).toBe(false);
    expect(isValidAddress(" So11111111111111111111111111111111111111112")).toBe(false);
    expect(isValidAddress("hello")).toBe(false);
  });
  it("round-trips", () => {
    const b = Uint8Array.from({ length: 32 }, (_, i) => (i * 37 + 11) & 0xff);
    expect(decodeBase58(encodeBase58(b))).toEqual(b);
  });
  it("finds an address inside a sentence and shortens it", () => {
    expect(findAddress("send 1 to So11111111111111111111111111111111111111112 now")).toBe("So11111111111111111111111111111111111111112");
    expect(shortAddress("So11111111111111111111111111111111111111112")).toBe("So11…1112");
  });
});
