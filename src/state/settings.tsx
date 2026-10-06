import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Network } from "../config/network";

export type Settings = {
  network: Network;
  speakReplies: boolean;
  preferOnDevice: boolean;
  speechRate: number;
};

// Devnet unless the person turns mainnet on in Settings, every time.
export const DEFAULT_SETTINGS: Settings = { network: "devnet", speakReplies: true, preferOnDevice: true, speechRate: 1 };
const KEY = "iris-settings-v1";

type Ctx = { settings: Settings; ready: boolean; update: (patch: Partial<Settings>) => void };
const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, ready: false, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...saved, network: saved.network === "mainnet" ? "mainnet" : "devnet" });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, ready, update }), [settings, ready, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
