import { submitUserCommand } from "../submitUserCommand";

describe("submitUserCommand (typed input uses the same handle as voice)", () => {
  it("trims and forwards to handle like onFinal speech", () => {
    const seen: string[] = [];
    const handle = (t: string) => {
      seen.push(t);
    };
    expect(submitUserCommand("  Send 0.01 SOL to Alice  ", handle)).toBe(true);
    expect(seen).toEqual(["Send 0.01 SOL to Alice"]);
  });

  it("clears the field before handle runs", () => {
    let cleared = false;
    submitUserCommand("What's my balance?", () => {}, () => {
      cleared = true;
    });
    expect(cleared).toBe(true);
  });

  it("ignores empty input", () => {
    const handle = jest.fn();
    expect(submitUserCommand("   ", handle)).toBe(false);
    expect(handle).not.toHaveBeenCalled();
  });
});
