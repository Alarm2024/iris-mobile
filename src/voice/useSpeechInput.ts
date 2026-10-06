// Hold-to-talk on Android's own speech recognizer: on-device when the phone
// has an offline model, otherwise the system recognizer. Free, no API key,
// and no audio leaves the app through Iris.

import {
  ExpoSpeechRecognitionModule,
  supportsOnDeviceRecognition,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useRef, useState } from "react";
import { stopSpeaking } from "./speak";

export type SpeechMode = "on-device" | "system";

// Words Iris listens for, so the recognizer prefers "SOL" over "soul".
const HINTS = ["SOL", "send", "balance", "transactions", "airdrop", "devnet", "confirm", "cancel", "clipboard", "SKR"];

type Options = { preferOnDevice: boolean; onFinal: (text: string) => void; onProblem: (message: string, code: string) => void };

export function useSpeechInput({ preferOnDevice, onFinal, onProblem }: Options) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [mode, setMode] = useState<SpeechMode>("system");
  const finalSent = useRef(false);
  const lastPartial = useRef("");
  // Whether the person is still holding the button. The first press opens
  // Android's microphone dialog; by the time it is answered the finger is up,
  // and starting then would record with nobody holding the button.
  const held = useRef(false);

  useSpeechRecognitionEvent("start", () => {
    finalSent.current = false;
    lastPartial.current = "";
    setListening(true);
  });
  useSpeechRecognitionEvent("end", () => {
    setListening(false);
    // Some recognizers end on release without marking a final result; the
    // last partial is what the person said.
    if (!finalSent.current && lastPartial.current.trim()) {
      finalSent.current = true;
      onFinal(lastPartial.current.trim());
    }
    setPartial("");
  });
  useSpeechRecognitionEvent("result", (e) => {
    const text = e.results[0]?.transcript ?? "";
    if (e.isFinal) {
      if (!finalSent.current && text.trim()) {
        finalSent.current = true;
        onFinal(text.trim());
      }
    } else {
      lastPartial.current = text;
      setPartial(text);
    }
  });
  useSpeechRecognitionEvent("error", (e) => {
    setListening(false);
    setPartial("");
    if (e.error === "aborted" || e.error === "no-speech" || e.error === "speech-timeout") {
      if (e.error !== "aborted") onProblem("I didn't hear anything. Hold the button while you speak.", e.error);
      return;
    }
    onProblem(e.message || e.error, e.error);
  });

  const start = useCallback(async () => {
    held.current = true;
    stopSpeaking();
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      held.current = false;
      onProblem("Iris needs the microphone to hear you. Allow it in Android settings, or type the command.", "not-allowed");
      return;
    }
    if (!held.current) {
      onProblem("Microphone ready. Hold the button and speak.", "released-early");
      return;
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      onProblem("This phone has no speech recognition service. Type the command instead.", "service-not-allowed");
      return;
    }
    const onDevice = preferOnDevice && supportsOnDeviceRecognition();
    setMode(onDevice ? "on-device" : "system");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: false,
      contextualStrings: HINTS,
      androidIntentOptions: { EXTRA_PREFER_OFFLINE: true },
    });
  }, [preferOnDevice, onProblem]);

  const stop = useCallback(() => {
    held.current = false;
    ExpoSpeechRecognitionModule.stop();
  }, []);

  return { listening, partial, mode, start, stop };
}
