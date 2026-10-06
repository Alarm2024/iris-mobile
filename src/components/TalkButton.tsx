import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";

type Props = { listening: boolean; disabled?: boolean; toggle?: boolean; onStart: () => void; onStop: () => void };

/**
 * Hold to talk: recording runs while the finger is down and stops on release.
 * With `toggle` (screen reader on) a tap starts and the next tap stops.
 */
export function TalkButton({ listening, disabled, toggle, onStart, onStop }: Props) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const ring = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
  };

  return (
    <View style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.ring, { backgroundColor: theme.colors.primary }, ring]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          toggle ? (listening ? "Listening. Tap to stop." : "Tap to talk") : listening ? "Listening. Release to send." : "Hold to talk"
        }
        accessibilityState={{ disabled: !!disabled, busy: listening }}
        disabled={disabled}
        onPressIn={toggle ? undefined : onStart}
        onPressOut={toggle ? undefined : onStop}
        onPress={toggle ? () => (listening ? onStop() : onStart()) : undefined}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: listening ? theme.colors.secondary : theme.colors.primary, opacity: disabled ? 0.5 : 1 },
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Icon source={listening ? "waveform" : "microphone"} size={38} color={listening ? theme.colors.onSecondary : theme.colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const SIZE = 84;
const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  button: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: "center", justifyContent: "center", elevation: 4 },
});
