// Viro is loaded only where its native modules are registered.
//
// plugins/withViroAr.js registers ReactViroPackage only when Viro's ARM
// renderer loads, so on an x86 emulator VRTMaterialManager is missing. A
// plain `import` of @reactvision/react-viro would still run its index, and
// ViroARPlaneSelector calls ViroMaterials.createMaterials (a native call) at
// import time, which would crash the app at start. So nothing imports Viro
// statically: callers use loadViro() / loadSafetyScene(), which return null
// when the native side is not there.
import { NativeModules, Platform } from "react-native";

export const viroLinked =
  Platform.OS === "android" && !!NativeModules.VRTARSceneNavigatorModule && !!NativeModules.VRTMaterialManager;

export function loadViro(): typeof import("@reactvision/react-viro") | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return viroLinked ? require("@reactvision/react-viro") : null;
}

export function loadSafetyScene(): typeof import("./SafetyScene").SafetyScene | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return viroLinked ? require("./SafetyScene").SafetyScene : null;
}
