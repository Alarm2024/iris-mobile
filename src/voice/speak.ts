import * as Speech from "expo-speech";

export function speak(text: string, rate = 1) {
  Speech.stop();
  Speech.speak(text, { language: "en-US", rate });
}

export function stopSpeaking() {
  Speech.stop();
}
