// Types a command into Iris and taps send (same path as VoiceScreen submitTyped).
const cmd = COMMAND;
if (!cmd) {
  throw new Error("COMMAND env is required");
}
maestro.tapOn("Type a command");
maestro.inputText(cmd);
maestro.tapOn("Send typed command");
