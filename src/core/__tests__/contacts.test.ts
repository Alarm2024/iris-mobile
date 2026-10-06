import { matchContact } from "../contacts";

const C = [
  { name: "Alice", address: "A1" },
  { name: "Bob", address: "B1" },
  { name: "Rob", address: "R1" },
  { name: "Mom", address: "M1" },
];

describe("contacts", () => {
  it("matches exactly, ignoring case and spaces", () => {
    expect(matchContact(C, "alice")).toEqual({ kind: "one", contact: C[0] });
    expect(matchContact(C, "A lice")).toEqual({ kind: "one", contact: C[0] });
  });
  it("forgives one letter the recognizer got wrong", () => {
    expect(matchContact(C, "alise")).toEqual({ kind: "one", contact: C[0] });
  });
  it("never guesses between two equally close names", () => {
    expect(matchContact(C, "lob")).toMatchObject({ kind: "many" });
  });
  it("says none when nothing is close", () => {
    expect(matchContact(C, "zebra")).toEqual({ kind: "none" });
    expect(matchContact(C, "")).toEqual({ kind: "none" });
  });
});
