import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Divider, HelperText, IconButton, List, SegmentedButtons, Switch, Text, TextInput } from "react-native-paper";
import { shortAddress } from "../core/address";
import { useContacts } from "../state/contacts";
import { useSettings } from "../state/settings";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import type { RootStack } from "./types";

export function SettingsScreen(_: NativeStackScreenProps<RootStack, "Settings">) {
  const { settings, update } = useSettings();
  const { contacts, add, remove } = useContacts();
  const { selectedAccount } = useAuthorization();
  const { disconnect } = useMobileWallet();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggleMainnet = (on: boolean) => {
    if (!on) return update({ network: "devnet" });
    Alert.alert(
      "Switch to mainnet?",
      "Mainnet uses real SOL. Every send still shows a confirm card and needs your approval in the wallet app.",
      [
        { text: "Stay on devnet", style: "cancel" },
        { text: "Use mainnet", style: "destructive", onPress: () => update({ network: "mainnet" }) },
      ],
    );
  };

  const save = () => {
    const err = add(name, address);
    setError(err);
    if (!err) {
      setName("");
      setAddress("");
    }
  };

  const commit = (Constants.expoConfig?.extra as { commit?: string } | undefined)?.commit ?? "dev";
  return (
    <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      <List.Section title="Network">
        <List.Item
          title="Mainnet"
          description={settings.network === "mainnet" ? "On — real SOL" : "Off — devnet (test SOL)"}
          left={(p) => <List.Icon {...p} icon="earth" />}
          right={() => <Switch value={settings.network === "mainnet"} onValueChange={toggleMainnet} accessibilityLabel="Use mainnet" />}
        />
        <Text variant="bodySmall" style={styles.note}>
          Each network has its own wallet connection. After switching, tap Connect wallet again.
        </Text>
      </List.Section>
      <Divider />

      <List.Section title="Voice">
        <List.Item
          title="Speak replies"
          left={(p) => <List.Icon {...p} icon="account-voice" />}
          right={() => <Switch value={settings.speakReplies} onValueChange={(v) => update({ speakReplies: v })} accessibilityLabel="Speak replies" />}
        />
        <List.Item
          title="Prefer on-device speech"
          description="Uses the phone's offline recognizer when it has one"
          left={(p) => <List.Icon {...p} icon="cellphone-lock" />}
          right={() => <Switch value={settings.preferOnDevice} onValueChange={(v) => update({ preferOnDevice: v })} accessibilityLabel="Prefer on-device speech" />}
        />
        <View style={styles.rate}>
          <Text variant="labelLarge" style={{ marginBottom: 6 }}>
            Reply speed
          </Text>
          <SegmentedButtons
            value={String(settings.speechRate)}
            onValueChange={(v) => update({ speechRate: Number(v) })}
            buttons={[
              { value: "0.8", label: "Slow" },
              { value: "1", label: "Normal" },
              { value: "1.25", label: "Fast" },
            ]}
          />
        </View>
      </List.Section>
      <Divider />

      <List.Section title="Contacts — say “send 0.01 SOL to Alice”">
        {contacts.length === 0 ? <Text style={styles.note}>No contacts yet.</Text> : null}
        {contacts.map((c) => (
          <List.Item
            key={c.name}
            title={c.name}
            description={shortAddress(c.address)}
            left={(p) => <List.Icon {...p} icon="account" />}
            right={() => <IconButton icon="delete" accessibilityLabel={`Delete ${c.name}`} onPress={() => remove(c.name)} />}
          />
        ))}
        <View style={styles.form}>
          <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <TextInput
            mode="outlined"
            label="Solana address"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginTop: 8 }}
            right={
              <TextInput.Icon
                icon="content-paste"
                accessibilityLabel="Paste address"
                onPress={async () => setAddress((await Clipboard.getStringAsync()).trim())}
              />
            }
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <Button mode="contained-tonal" icon="account-plus" onPress={save}>
            Save contact
          </Button>
        </View>
      </List.Section>
      <Divider />

      <List.Section title="Wallet">
        <List.Item
          title={selectedAccount ? shortAddress(selectedAccount.publicKey.toBase58()) : "Not connected"}
          description={selectedAccount ? `Connected on ${settings.network}` : undefined}
          left={(p) => <List.Icon {...p} icon="wallet" />}
        />
        {selectedAccount ? (
          <Button style={styles.button} mode="outlined" icon="link-off" onPress={() => disconnect().catch(() => {})}>
            Disconnect
          </Button>
        ) : null}
      </List.Section>
      <Divider />

      <List.Section title="About">
        <Text style={styles.note}>
          Iris never holds a key. Reads come from the public {settings.network} RPC; every send is signed in your wallet
          app after you confirm the card. Speech uses Android's own recognizer.
        </Text>
        <Text style={styles.note}>
          Version {Constants.expoConfig?.version ?? "?"} · build {commit}
        </Text>
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { paddingBottom: 32 },
  note: { paddingHorizontal: 16, opacity: 0.8, marginVertical: 4 },
  rate: { paddingHorizontal: 16, paddingBottom: 8 },
  form: { paddingHorizontal: 16, marginTop: 8 },
  button: { marginHorizontal: 16 },
});
