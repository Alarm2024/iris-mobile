import { DarkTheme as NavDark, DefaultTheme as NavLight, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { PaperProvider, adaptNavigationTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import type { RootStack } from "./src/screens/types";
import { VoiceScreen } from "./src/screens/VoiceScreen";
import { ContactsProvider } from "./src/state/contacts";
import { SettingsProvider } from "./src/state/settings";
import { darkTheme, lightTheme } from "./src/theme";
import { ConnectionProvider } from "./src/wallet/connection";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
const Stack = createNativeStackNavigator<RootStack>();
const { LightTheme, DarkTheme } = adaptNavigationTheme({ reactNavigationLight: NavLight, reactNavigationDark: NavDark });

export default function App() {
  const dark = useColorScheme() !== "light";
  const paper = dark ? darkTheme : lightTheme;
  const nav = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: paper.colors.background, card: paper.colors.surface, primary: paper.colors.primary } }
    : { ...LightTheme, colors: { ...LightTheme.colors, background: paper.colors.background, primary: paper.colors.primary } };
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <ContactsProvider>
            <ConnectionProvider>
              <PaperProvider theme={paper}>
                <NavigationContainer theme={nav}>
                  <StatusBar style={dark ? "light" : "dark"} />
                  <Stack.Navigator>
                    <Stack.Screen name="Voice" component={VoiceScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                  </Stack.Navigator>
                </NavigationContainer>
              </PaperProvider>
            </ConnectionProvider>
          </ContactsProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
