import { displaySol, lamportsToSol, solToLamports } from "../amount";

describe("exact lamports", () => {
  it("converts without floating point", () => {
    expect(solToLamports("0.01")).toBe(BigInt(10000000));
    expect(solToLamports("0.1")).toBe(BigInt(100000000));
    expect(solToLamports("1.000000001")).toBe(BigInt(1000000001));
    expect(solToLamports("12")).toBe(BigInt(12000000000));
  });
  it("refuses what is not a SOL amount", () => {
    expect(() => solToLamports("0.0000000001")).toThrow();
    expect(() => solToLamports("-1")).toThrow();
    expect(() => solToLamports("1e3")).toThrow();
    expect(() => solToLamports("")).toThrow();
  });
  it("prints exact and display forms", () => {
    expect(lamportsToSol(BigInt(10000000))).toBe("0.01");
    expect(lamportsToSol(BigInt(1500000000))).toBe("1.5");
    expect(lamportsToSol(BigInt(5000))).toBe("0.000005");
    expect(lamportsToSol(BigInt(-5000))).toBe("-0.000005");
    expect(displaySol(BigInt(1234567890))).toBe("1.2345");
    expect(displaySol(BigInt(5000))).toBe("<0.0001");
    expect(displaySol(BigInt(0))).toBe("0");
  });
});
