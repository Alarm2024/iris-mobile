import {
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
  type PathConfigMap,
} from "@react-navigation/native";
import type { RootStack } from "../screens/types";

/**
 * irisdeskvoice:// may only open Voice or Settings — never a wallet
 * authorize/sign route (e.g. irisdeskvoice://wallet/sign).
 */
export const DEEP_LINK_WHITELIST = new Set(["", "settings"]);

const linkingScreens: PathConfigMap<RootStack> = {
  Voice: "",
  Settings: "settings",
};

/** Strip query/hash and slashes so whitelist checks are path-only. */
export function normalizeDeepLinkPath(path: string): string {
  return path.split("?")[0]!.split("#")[0]!.replace(/^\/+|\/+$/g, "").toLowerCase();
}

export function isAllowedDeepLinkPath(path: string): boolean {
  return DEEP_LINK_WHITELIST.has(normalizeDeepLinkPath(path));
}

/** Path after `irisdeskvoice://` (host + pathname for opaque URLs). */
export function pathFromDeepLinkUrl(url: string): string {
  const stripped = url.trim().replace(/^irisdeskvoice:\/\//i, "");
  return normalizeDeepLinkPath(stripped);
}

export function isAllowedDeepLinkUrl(url: string): boolean {
  if (!/^irisdeskvoice:/i.test(url.trim())) return false;
  return isAllowedDeepLinkPath(pathFromDeepLinkUrl(url));
}

export const linking: LinkingOptions<RootStack> = {
  prefixes: ["irisdeskvoice://"],
  config: {
    screens: linkingScreens,
  },
  // Drop unknown / hostile URLs before navigation runs.
  filter: (url) => isAllowedDeepLinkUrl(url),
  getStateFromPath(path, options) {
    if (!isAllowedDeepLinkPath(path)) {
      return undefined;
    }
    return defaultGetStateFromPath(path, options);
  },
};
