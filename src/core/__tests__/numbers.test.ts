import { findAmount } from "../numbers";
import { tokenize } from "../intent";

const amt = (s: string) => findAmount(tokenize(s))?.value ?? null;

describe("amounts as Android writes them", () => {
  it("reads digits", () => {
    expect(amt("send 0.01 SOL to alice")).toBe("0.01");
    expect(amt("send .5 sol")).toBe("0.5");
    expect(amt("send 2 sol")).toBe("2");
    expect(amt("send 0,25 sol")).toBe("0.25");
    expect(amt("send $1.50 sol")).toBe("1.5");
  });
  it("reads words", () => {
    expect(amt("send point zero one sol")).toBe("0.01");
    expect(amt("send zero point five sol")).toBe("0.5");
    expect(amt("send two sol")).toBe("2");
    expect(amt("send twenty five sol")).toBe("25");
    expect(amt("send one and a half sol")).toBe("1.5");
    expect(amt("send half a sol")).toBe("0.5");
    expect(amt("send a quarter sol")).toBe("0.25");
    expect(amt("send one hundred twenty sol")).toBe("120");
  });
  it("does not invent an amount", () => {
    expect(amt("send sol to alice")).toBeNull();
    expect(amt("oh send it to alice")).toBeNull();
  });
});
