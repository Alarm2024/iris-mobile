import { Linking, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import type { Message } from "../assistant/useAssistant";

export function MessageBubble({ m }: { m: Message }) {
  const theme = useTheme();
  const mine = m.role === "user";
  const bg = mine
    ? theme.colors.primary
    : m.tone === "error"
      ? theme.colors.errorContainer
      : m.tone === "success"
        ? theme.colors.secondaryContainer
        : theme.colors.surfaceVariant;
  const fg = mine
    ? theme.colors.onPrimary
    : m.tone === "error"
      ? theme.colors.onErrorContainer
      : m.tone === "success"
        ? theme.colors.onSecondaryContainer
        : theme.colors.onSurfaceVariant;
  return (
    <View style={[styles.row, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, { backgroundColor: bg }, mine ? styles.mine : styles.theirs]}>
        <Text selectable style={{ color: fg, fontSize: 16, lineHeight: 22 }}>
          {m.text}
        </Text>
        {m.link ? (
          <Button compact mode="text" icon="open-in-new" textColor={fg} onPress={() => Linking.openURL(m.link!.url)} style={styles.link}>
            {m.link.label}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginVertical: 4, paddingHorizontal: 12 },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  bubble: { maxWidth: "86%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  mine: { borderBottomRightRadius: 6 },
  theirs: { borderBottomLeftRadius: 6 },
  link: { alignSelf: "flex-start", marginLeft: -8, marginTop: 2 },
});
