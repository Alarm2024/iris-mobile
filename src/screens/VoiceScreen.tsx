import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { androidTriggerOfflineModelDownload } from "expo-speech-recognition";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, FlatList, StyleSheet, View } from "react-native";
import { Appbar, Chip, IconButton, Text, TextInput, useTheme } from "react-native-paper";
import { userCommandFromText } from "../assistant/commandText";
import { Message, useAssistant } from "../assistant/useAssistant";
import { ConfirmCard } from "../components/ConfirmCard";
import { MessageBubble } from "../components/MessageBubble";
import { TalkButton } from "../components/TalkButton";
import { WalletBar } from "../components/WalletBar";
import { useSettings } from "../state/settings";
import { BRAND } from "../theme";
import { useSpeechInput } from "../voice/useSpeechInput";
import type { RootStack } from "./types";

const SUGGESTIONS = ["What's my balance?", "Show my last transactions", "Airdrop 1 SOL", "Help"];

export function VoiceScreen({ navigation }: NativeStackScreenProps<RootStack, "Voice">) {
  const theme = useTheme();
  const { settings } = useSettings();
  const assistant = useAssistant();
  const { handle, note } = assistant;
  const [typed, setTyped] = useState("");
  const [screenReader, setScreenReader] = useState(false);
  const list = useRef<FlatList<Message>>(null);

  // TalkBack's double-tap cannot hold a button, so with a screen reader on the
  // mic becomes tap to start, tap to stop.
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("screenReaderChanged", setScreenReader);
    return () => sub.remove();
  }, []);

  const onFinal = useCallback((text: string) => void handle(text), [handle]);
  const onProblem = useCallback(
    (message: string, code: string) => {
      if (code === "released-early") {
        note(message);
        return;
      }
      if (code === "language-not-supported") {
        note("This phone needs the offline English speech model. Opening the download — or turn off on-device speech in Settings.", "error");
        androidTriggerOfflineModelDownload({ locale: "en-US" }).catch(() => {});
        return;
      }
      note(message, "error");
    },
    [note],
  );
  const speech = useSpeechInput({ preferOnDevice: settings.preferOnDevice, onFinal, onProblem });

  useEffect(() => {
    if (assistant.messages.length) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [assistant.messages.length, assistant.pending]);

  const submitTyped = () => {
    const cmd = userCommandFromText(typed);
    if (!cmd) return;
    setTyped("");
    void handle(cmd.text);
  };

  const mainnet = settings.network === "mainnet";
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Iris Desk Voice" />
        <Chip
          compact
          onPress={() => navigation.navigate("Settings")}
          textStyle={{ color: "#fff", fontWeight: "700" }}
          style={{ backgroundColor: mainnet ? BRAND.mainnet : BRAND.devnet, marginRight: 4 }}
          accessibilityLabel={`Network: ${mainnet ? "mainnet" : "devnet"}. Opens settings.`}
        >
          {mainnet ? "MAINNET" : "DEVNET"}
        </Chip>
        <Appbar.Action icon="cog" accessibilityLabel="Settings" onPress={() => navigation.navigate("Settings")} />
      </Appbar.Header>

      <WalletBar onError={(m) => note(m, "error")} />

      <FlatList
        ref={list}
        style={styles.list}
        contentContainerStyle={assistant.messages.length ? styles.listPad : styles.empty}
        data={assistant.messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => <MessageBubble m={item} />}
        ListEmptyComponent={
          <View style={styles.hint}>
            <Text variant="headlineSmall" style={{ textAlign: "center" }}>
              Hold the mic and talk.
            </Text>
            <Text variant="bodyMedium" style={[styles.hintBody, { color: theme.colors.onSurfaceVariant }]}>
              “What's my balance?” · “Show my last transactions” · “Send 0.01 SOL to Alice”
            </Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <Chip key={s} style={styles.chip} onPress={() => void handle(s)}>
                  {s}
                </Chip>
              ))}
            </View>
          </View>
        }
      />

      {assistant.pending ? (
        <ConfirmCard pending={assistant.pending} busy={assistant.busy} onConfirm={() => void assistant.confirm()} onCancel={assistant.cancel} />
      ) : null}

      {speech.listening ? (
        <Text style={[styles.partial, { color: theme.colors.onSurfaceVariant }]} accessibilityLiveRegion="polite">
          {speech.partial ? `“${speech.partial}”` : `Listening (${speech.mode})…`}
        </Text>
      ) : null}

      <View style={[styles.bottom, { borderTopColor: theme.colors.outlineVariant }]}>
        <TextInput
          mode="outlined"
          dense
          style={styles.input}
          placeholder="Or type a command"
          value={typed}
          onChangeText={setTyped}
          onSubmitEditing={submitTyped}
          returnKeyType="send"
          accessibilityLabel="Type a command"
          right={<TextInput.Icon icon="send" onPress={submitTyped} accessibilityLabel="Send typed command" />}
        />
        <TalkButton
          listening={speech.listening}
          disabled={assistant.busy}
          toggle={screenReader}
          onStart={() => void speech.start()}
          onStop={speech.stop}
        />
        {assistant.busy ? <IconButton icon="progress-clock" disabled accessibilityLabel="Working" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  listPad: { paddingVertical: 10 },
  empty: { flexGrow: 1, justifyContent: "center" },
  hint: { paddingHorizontal: 28, alignItems: "center" },
  hintBody: { textAlign: "center", marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 16, gap: 8 },
  chip: { marginVertical: 2 },
  partial: { textAlign: "center", paddingHorizontal: 16, paddingBottom: 6, fontStyle: "italic" },
  bottom: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1 },
});
