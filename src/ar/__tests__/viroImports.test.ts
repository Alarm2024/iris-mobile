// Importing @reactvision/react-viro runs native calls at import time, which
// crash an x86 build where Viro is not registered. Only SafetyScene.tsx may
// import it, and only ../viro.ts may load that file (with require).
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../../..");

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : sources(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe("Viro is never imported statically", () => {
  const files = [...sources(path.join(ROOT, "src")), path.join(ROOT, "App.tsx"), path.join(ROOT, "index.ts")];
  it("only SafetyScene.tsx imports @reactvision/react-viro", () => {
    const importers = files.filter((f) => /^import [^;]*from "@reactvision\/react-viro"/m.test(fs.readFileSync(f, "utf8")));
    expect(importers.map((f) => path.relative(ROOT, f))).toEqual([path.join("src", "ar", "SafetyScene.tsx")]);
  });
  it("nothing imports SafetyScene statically", () => {
    const importers = files.filter((f) => /^import [^;]*from "[^"]*\/SafetyScene"/m.test(fs.readFileSync(f, "utf8")));
    expect(importers).toEqual([]);
  });
});
