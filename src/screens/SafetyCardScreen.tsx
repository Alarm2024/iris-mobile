import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PermissionsAndroid, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Divider, Text, useTheme } from "react-native-paper";
import { loadSafetyScene, loadViro, viroLinked } from "../ar/viro";
import { arAvailability, buildSafetyCard, type ActivityState, type BalanceState, type SafetyCard } from "../core/safetyCard";
import { useSettings } from "../state/settings";
import { useAuthorization } from "../utils/useAuthorization";
import { getBalanceLamports, getRecent } from "../wallet/actions";
import { useConnection } from "../wallet/connection";
import type { RootStack } from "./types";

// Viro is required here, not imported: on x86 builds its native modules are
// absent and importing it would crash (see ../ar/viro.ts).
const viro = loadViro();
const SafetyScene = loadSafetyScene();

function useCard(): SafetyCard {
  const { settings } = useSettings();
  const { selectedAccount } = useAuthorization();
  const connection = useConnection();
  const address = selectedAccount?.publicKey.toBase58() ?? null;
  const balance = useQuery({
    queryKey: ["balance", settings.network, address],
    queryFn: () => getBalanceLamports(connection, selectedAccount!.publicKey),
    enabled: !!selectedAccount,
  });
  const recent = useQuery({
    queryKey: ["recent", settings.network, address, 3],
    queryFn: () => getRecent(connection, selectedAccount!.publicKey, 3),
    enabled: !!selectedAccount,
  });
  let activity: ActivityState | null = null;
  if (address) {
    if (recent.isError) activity = { kind: "error", message: recent.error instanceof Error ? recent.error.message : String(recent.error) };
    else if (recent.data) activity = { kind: "ok", items: recent.data, nowSec: Math.floor(Date.now() / 1000) };
    else activity = { kind: "loading" };
  }
  let state: BalanceState | null = null;
  if (address) {
    if (balance.isError) state = { kind: "error", message: balance.error instanceof Error ? balance.error.message : String(balance.error) };
    else if (balance.data != null) state = { kind: "ok", lamports: balance.data };
    else state = { kind: "loading" };
  }
  return buildSafetyCard({ network: settings.network, address, balance: state, activity });
}

function FlatCard({ card, reason }: { card: SafetyCard; reason?: string }) {
  const theme = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.pad}>
      {reason ? (
        <Text variant="bodySmall" style={[styles.reason, { color: theme.colors.onSurfaceVariant }]}>
          {reason}
        </Text>
      ) : null}
      <Card mode="elevated">
        <Card.Title title={card.title} titleVariant="titleLarge" />
        <Card.Content>
          {card.facts.map((f) => (
            <View key={f.label} style={styles.fact} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
              <Text variant="labelLarge" style={{ width: 80 }}>
                {f.label}
              </Text>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {f.value}
              </Text>
            </View>
          ))}
          <Divider style={{ marginVertical: 10 }} />
          <Text variant="labelLarge" style={styles.rule}>
            Recent activity
          </Text>
          {card.activity.map((a) => (
            <Text key={a} variant="bodyMedium" style={styles.rule}>
              {a}
            </Text>
          ))}
          <Divider style={{ marginVertical: 10 }} />
          {card.rules.map((r, i) => (
            <Text key={r} variant="bodyMedium" style={styles.rule}>
              {i + 1}. {r}
            </Text>
          ))}
          <Text variant="bodySmall" style={{ marginTop: 10, color: theme.colors.onSurfaceVariant }}>
            {card.footer}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

export function SafetyCardScreen(_: NativeStackScreenProps<RootStack, "SafetyCard">) {
  const card = useCard();
  const [arcore, setArcore] = useState<string | null>(null);
  const [camera, setCamera] = useState<"asking" | "granted" | "denied">("asking");
  const [flat, setFlat] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!viro) return;
    viro
      .isARSupportedOnDevice()
      .then(() => setArcore("SUPPORTED"))
      .catch((e: unknown) => setArcore(e instanceof Error ? e.message : String(e)));
  }, []);

  const availability = arAvailability(viroLinked, arcore);
  useEffect(() => {
    if (availability.kind !== "ar") return;
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
      title: "Camera for the AR card",
      message: "Iris uses the camera only to place the safety card in front of you. Nothing is recorded or sent.",
      buttonPositive: "Allow",
      buttonNegative: "Not now",
    }).then((r) => setCamera(r === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied"));
  }, [availability.kind]);

  if (availability.kind === "flat") return <FlatCard card={card} reason={availability.reason} />;
  if (availability.kind === "checking" || camera === "asking") {
    return <FlatCard card={card} reason="Checking whether this phone can show the card in AR…" />;
  }
  if (camera === "denied") return <FlatCard card={card} reason="The camera was not allowed, so the card is shown flat." />;
  if (flat) {
    return (
      <View style={{ flex: 1 }}>
        <FlatCard card={card} />
        <Button mode="contained-tonal" icon="augmented-reality" style={styles.toggle} onPress={() => setFlat(false)}>
          Show in AR
        </Button>
      </View>
    );
  }
  if (!viro || !SafetyScene) return <FlatCard card={card} reason="The AR engine is not available in this build." />;
  const { ViroARSceneNavigator } = viro;
  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        style={{ flex: 1 }}
        autofocus
        initialScene={{ scene: SafetyScene as never }}
        viroAppProps={{ card, onPlaced: () => setPlaced(true) }}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <Text style={styles.overlayText}>
          {placed
            ? `Walk around the card; it turns to face you. ${card.footer}`
            : "Point the camera at a table or the floor and move it slowly. When a surface lights up, tap it to place the card."}
        </Text>
        <Button mode="contained-tonal" icon="card-text-outline" onPress={() => setFlat(true)} accessibilityLabel="Read the card as text">
          Read as text
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16 },
  reason: { marginBottom: 12 },
  fact: { flexDirection: "row", paddingVertical: 4 },
  rule: { marginBottom: 6 },
  toggle: { margin: 16 },
  overlay: { position: "absolute", left: 16, right: 16, bottom: 24, gap: 8 },
  overlayText: { color: "#fff", backgroundColor: "rgba(5,1,12,0.7)", padding: 8, borderRadius: 8 },
});
