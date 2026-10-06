import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

// The Iris eye: cyan on near-black, same as iris-35.elghaly.dev.
export const BRAND = { cyan: "#19FBFF", ink: "#05010C", mainnet: "#E5484D", devnet: "#2E9E6A" };

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BRAND.cyan,
    onPrimary: "#03161A",
    primaryContainer: "#0B3B40",
    onPrimaryContainer: "#BFFBFF",
    secondary: "#7DD3C0",
    secondaryContainer: "#123B33",
    onSecondaryContainer: "#C6F4E8",
    background: BRAND.ink,
    surface: "#0E0B1A",
    surfaceVariant: "#1A1729",
    onSurfaceVariant: "#C9C5D9",
    outlineVariant: "#2C2840",
    elevation: { ...MD3DarkTheme.colors.elevation, level1: "#110E1F", level2: "#161326", level3: "#1B182D" },
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: "#007C86", onPrimary: "#FFFFFF", secondary: "#2F6F63", background: "#F6F7FA" },
};
