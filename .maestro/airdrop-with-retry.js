const MAX = 5;
let ok = false;
for (let attempt = 1; attempt <= MAX; attempt++) {
  maestro.tapOn("Type a command");
  maestro.inputText("Airdrop 1 SOL");
  maestro.tapOn("Send typed command");
  try {
    maestro.waitForVisible("Airdropped", 120000);
    ok = true;
    break;
  } catch (_) {
    if (attempt < MAX) {
      maestro.wait(20000);
    }
  }
}
output.AIRDROP_OK = ok ? "true" : "false";
console.log("DEMO_AIRDROP_OK=" + (ok ? "true" : "false"));
