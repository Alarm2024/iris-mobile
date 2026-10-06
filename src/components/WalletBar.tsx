import { useQuery } from "@tanstack/react-query";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Avatar, Button, Surface, Text, useTheme } from "react-native-paper";
import { displaySol } from "../core/amount";
import { shortAddress } from "../core/address";
import { useSettings } from "../state/settings";
import { useAuthorization } from "../utils/useAuthorization";
import { useMobileWallet } from "../utils/useMobileWallet";
import { useConnection } from "../wallet/connection";
import { getBalanceLamports } from "../wallet/actions";

export function WalletBar({ onError }: { onError: (message: string) => void }) {
  const theme = useTheme();
  const { settings } = useSettings();
  const { selectedAccount } = useAuthorization();
  const { connect } = useMobileWallet();
  const connection = useConnection();
  const address = selectedAccount?.publicKey.toBase58() ?? null;

  const balance = useQuery({
    queryKey: ["balance", settings.network, address],
    queryFn: () => getBalanceLamports(connection, selectedAccount!.publicKey),
    enabled: !!selectedAccount,
    refetchInterval: 30000,
  });

  if (!selectedAccount) {
    return (
      <Surface style={styles.bar} elevation={1}>
        <Text style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>No wallet connected</Text>
        <Button
          mode="contained"
          icon="wallet"
          onPress={() =>
            connect().catch((e: unknown) => onError(`Couldn't connect: ${e instanceof Error ? e.message : String(e)}`))
          }
        >
          Connect wallet
        </Button>
      </Surface>
    );
  }
  return (
    <Surface style={styles.bar} elevation={1}>
      <Avatar.Icon size={36} icon="wallet" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text variant="labelLarge">{selectedAccount.label ?? "Wallet"}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {shortAddress(address!)}
        </Text>
      </View>
      {balance.isLoading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text variant="titleMedium" accessibilityLabel="Balance">
          {balance.data != null ? `${displaySol(balance.data)} SOL` : "—"}
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 8, padding: 12, borderRadius: 16 },
});
