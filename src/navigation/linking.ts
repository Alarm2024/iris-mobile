import type { LinkingOptions } from "@react-navigation/native";
import type { RootStack } from "../screens/types";

/** Deep links: irisdeskvoice://settings and irisdeskvoice:// (Voice). */
export const linking: LinkingOptions<RootStack> = {
  prefixes: ["irisdeskvoice://"],
  config: {
    screens: {
      Voice: "",
      Settings: "settings",
    },
  },
};