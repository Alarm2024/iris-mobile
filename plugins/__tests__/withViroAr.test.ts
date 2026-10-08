// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addViroToAppGradle, addViroToMainApplication, addViroToManifest, addViroToSettings } = require("../withViroAr");

// Shapes `expo prebuild` writes for SDK 52 (trimmed).
const SETTINGS = `rootProject.name = 'Iris Desk Voice'\ninclude ':app'`;
const APP_GRADLE = `dependencies {
    // The version of react-native is set by the React Native Gradle Plugin
    implementation("com.facebook.react:react-android")
}`;
const MAIN_APP = `class MainApplication : Application(), ReactApplication {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            return packages
          }
}`;

function manifest() {
  return {
    manifest: {
      $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
      "uses-permission": [{ $: { "android:name": "android.permission.RECORD_AUDIO" } }],
      queries: [
        { package: [{ $: { "android:name": "com.google.android.googlequicksearchbox" } }], intent: [{ action: [{ $: { "android:name": "android.speech.RecognitionService" } }] }] },
        { package: [{ $: { "android:name": "com.google.android.tts" } }] },
      ],
      application: [{ $: { "android:name": ".MainApplication" } }],
    },
  };
}

describe("Viro AR plugin", () => {
  it("links the four Viro projects once", () => {
    const out = addViroToSettings(SETTINGS);
    expect(out).toContain("include ':react_viro', ':arcore_client', ':gvr_common', ':viro_renderer'");
    expect(out).toContain("project(':viro_renderer').projectDir = new File(rootDir, '../node_modules/@reactvision/react-viro/android/viro_renderer')");
    expect(addViroToSettings(out)).toBe(out);
  });

  it("adds the Viro dependencies after react-android", () => {
    const out = addViroToAppGradle(APP_GRADLE);
    expect(out.indexOf("implementation project(':viro_renderer')")).toBeGreaterThan(out.indexOf('implementation("com.facebook.react:react-android")'));
    expect(addViroToAppGradle(out)).toBe(out);
    expect(() => addViroToAppGradle("dependencies {}")).toThrow(/react-android/);
  });

  it("registers Viro only when its ARM renderer loads", () => {
    const out = addViroToMainApplication(MAIN_APP);
    expect(out).toContain('System.loadLibrary("viro_renderer")');
    expect(out).toContain("catch (e: UnsatisfiedLinkError) { false }");
    expect(out).toContain("if (viroLoads) packages.add(com.viromedia.bridge.ReactViroPackage(com.viromedia.bridge.ReactViroPackage.ViroPlatform.AR))");
    expect(out).not.toMatch(/ViroPlatform\.(GVR|OVR_MOBILE)/);
    expect(out.indexOf("viroLoads")).toBeLessThan(out.indexOf("return packages"));
    expect(addViroToMainApplication(out)).toBe(out);
  });

  it("adds the camera permission, makes Viro's hard requirements optional, and keeps <queries>", () => {
    const m = manifest();
    const before = JSON.stringify(m.manifest.queries);
    const out = addViroToManifest(m).manifest;
    expect(out["uses-permission"].map((p: { $: Record<string, string> }) => p.$["android:name"])).toEqual([
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
    ]);
    expect(JSON.stringify(out.queries)).toBe(before);
    const features = out["uses-feature"].map((f: { $: Record<string, string> }) => f.$);
    for (const f of features) {
      expect(f["android:required"]).toBe("false");
      expect(f["tools:replace"]).toBe("android:required");
    }
    expect(features.map((f: Record<string, string>) => f["android:name"] ?? f["android:glEsVersion"])).toEqual([
      "android.hardware.camera",
      "android.hardware.camera.autofocus",
      "android.hardware.sensor.accelerometer",
      "android.hardware.sensor.gyroscope",
      "0x00030000",
    ]);
    expect(out.$["xmlns:tools"]).toBe("http://schemas.android.com/tools");
    // Running it twice changes nothing.
    const again = addViroToManifest({ manifest: JSON.parse(JSON.stringify(out)) }).manifest;
    expect(again).toEqual(out);
  });
});
