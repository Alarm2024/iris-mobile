import { StyleSheet, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import type { PendingSend } from "../assistant/useAssistant";
import { lamportsToSol } from "../core/amount";
import { TRANSFER_FEE_LAMPORTS } from "../wallet/actions";
import { BRAND } from "../theme";

type Props = { pending: PendingSend; busy: boolean; onConfirm: () => void; onCancel: () => void };

/** The last thing shown before the wallet opens: who, how much, which network. */
export function ConfirmCard({ pending, busy, onConfirm, onCancel }: Props) {
  const theme = useTheme();
  const mainnet = pending.network === "mainnet";
  return (
    <Card mode="elevated" style={[styles.card, mainnet && { borderColor: BRAND.mainnet, borderWidth: 2 }]} accessibilityLabel="Confirm send">
      <Card.Content>
        <View style={styles.head}>
          <Text variant="titleMedium">Confirm send</Text>
          <Chip compact textStyle={{ color: "#fff", fontWeight: "700" }} style={{ backgroundColor: mainnet ? BRAND.mainnet : BRAND.devnet }}>
            {mainnet ? "MAINNET · real SOL" : "DEVNET · test SOL"}
          </Chip>
        </View>
        <Text variant="displaySmall" style={styles.amount}>
          {lamportsToSol(pending.lamports)} SOL
        </Text>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          To {pending.label !== pending.to ? pending.label : "address"}
        </Text>
        <Text selectable variant="bodyMedium" style={styles.address}>
          {pending.to}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
          Network fee about {lamportsToSol(TRANSFER_FEE_LAMPORTS)} SOL · your wallet shows the final amounts and signs.
        </Text>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} disabled={busy} accessibilityLabel="Cancel send">
          Cancel
        </Button>
        <Button mode="contained" icon="shield-check" onPress={onConfirm} loading={busy} disabled={busy} accessibilityLabel="Confirm and sign in wallet">
          Confirm & sign
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginBottom: 8 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  amount: { fontWeight: "700", marginVertical: 4 },
  address: { fontFamily: "monospace", marginTop: 2 },
  actions: { justifyContent: "flex-end", gap: 8 },
});
