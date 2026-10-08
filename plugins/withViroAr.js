// ViroReact AR for the safety card, without the stock Viro config plugin.
//
// The stock plugin (@reactvision/react-viro/app.plugin.js) replaces the
// manifest's <queries> list, which would drop the speech-recognition queries
// expo-speech-recognition adds, and its Kotlin edit is written from an async
// callback that can land after prebuild returns. This plugin does only what
// AR needs, synchronously:
// - links Viro's four Android projects (settings.gradle, app/build.gradle);
// - registers ReactViroPackage(AR) in MainApplication, but only when Viro's
//   native renderer loads: Viro ships it for arm64-v8a and armeabi-v7a only,
//   so on an x86 emulator the package is left out and the app shows the
//   safety card flat instead of crashing at start;
// - adds the CAMERA permission, and marks the camera and the sensors and
//   OpenGL ES 3 that Viro's own manifest makes hard requirements as optional.
//   ARCore stays optional (Viro's manifest already says so); existing
//   <queries> are left alone, and ARCore's own queries merge in from its AAR.
const { withAndroidManifest, withAppBuildGradle, withMainApplication, withSettingsGradle } = require("expo/config-plugins");

const MARK = "Iris: Viro AR";
const VIRO_PROJECTS = ["react_viro", "arcore_client", "gvr_common", "viro_renderer"];

function addViroToSettings(gradle) {
  if (gradle.includes(MARK)) return gradle;
  const lines = VIRO_PROJECTS.map(
    (p) => `project(':${p}').projectDir = new File(rootDir, '../node_modules/@reactvision/react-viro/android/${p}')`,
  );
  return `${gradle}\n// ${MARK}\ninclude ${VIRO_PROJECTS.map((p) => `':${p}'`).join(", ")}\n${lines.join("\n")}\n`;
}

const APP_DEPENDENCIES = `
    // ${MARK} (versions as in @reactvision/react-viro's own install steps)
    implementation project(':gvr_common')
    implementation project(':arcore_client')
    implementation project(':react_viro')
    implementation project(':viro_renderer')
    implementation 'androidx.media3:media3-exoplayer:1.1.1'
    implementation 'androidx.media3:media3-exoplayer-dash:1.1.1'
    implementation 'androidx.media3:media3-exoplayer-hls:1.1.1'
    implementation 'androidx.media3:media3-exoplayer-smoothstreaming:1.1.1'
    implementation 'com.google.protobuf.nano:protobuf-javanano:3.1.0'`;

function addViroToAppGradle(gradle) {
  if (gradle.includes(MARK)) return gradle;
  const anchor = 'implementation("com.facebook.react:react-android")';
  if (!gradle.includes(anchor)) throw new Error(`withViroAr: android/app/build.gradle has no ${anchor} line`);
  return gradle.replace(anchor, `${anchor}\n${APP_DEPENDENCIES}`);
}

const PACKAGE_LINES = `
            // ${MARK}: the renderer has native code for ARM only. Where it does not
            // load (an x86 emulator), Viro is left out and the safety card is shown flat.
            val viroLoads = try { System.loadLibrary("viro_renderer"); true } catch (e: UnsatisfiedLinkError) { false }
            if (viroLoads) packages.add(com.viromedia.bridge.ReactViroPackage(com.viromedia.bridge.ReactViroPackage.ViroPlatform.AR))`;

function addViroToMainApplication(kotlin) {
  if (kotlin.includes(MARK)) return kotlin;
  const anchor = /(\n\s*val packages = PackageList\(this\)\.packages)/;
  if (!anchor.test(kotlin)) throw new Error("withViroAr: MainApplication.kt has no `val packages = PackageList(this).packages` line");
  return kotlin.replace(anchor, `$1${PACKAGE_LINES}`);
}

const OPTIONAL_FEATURES = [
  { "android:name": "android.hardware.camera" },
  { "android:name": "android.hardware.camera.autofocus" },
  { "android:name": "android.hardware.sensor.accelerometer" },
  { "android:name": "android.hardware.sensor.gyroscope" },
  { "android:glEsVersion": "0x00030000" },
];

function addViroToManifest(manifest) {
  const root = manifest.manifest;
  root.$ = root.$ || {};
  root.$["xmlns:tools"] = root.$["xmlns:tools"] || "http://schemas.android.com/tools";

  const perms = (root["uses-permission"] = root["uses-permission"] || []);
  if (!perms.some((p) => p.$ && p.$["android:name"] === "android.permission.CAMERA")) {
    perms.push({ $: { "android:name": "android.permission.CAMERA" } });
  }

  const features = (root["uses-feature"] = root["uses-feature"] || []);
  for (const f of OPTIONAL_FEATURES) {
    const key = Object.keys(f)[0];
    const existing = features.find((x) => x.$ && x.$[key] === f[key]);
    const attrs = { ...f, "android:required": "false", "tools:replace": "android:required" };
    if (existing) existing.$ = { ...existing.$, ...attrs };
    else features.push({ $: attrs });
  }
  return manifest;
}

function withViroAr(config) {
  config = withSettingsGradle(config, (cfg) => {
    cfg.modResults.contents = addViroToSettings(cfg.modResults.contents);
    return cfg;
  });
  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addViroToAppGradle(cfg.modResults.contents);
    return cfg;
  });
  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== "kt") throw new Error("withViroAr: expected a Kotlin MainApplication");
    cfg.modResults.contents = addViroToMainApplication(cfg.modResults.contents);
    return cfg;
  });
  config = withAndroidManifest(config, (cfg) => {
    cfg.modResults = addViroToManifest(cfg.modResults);
    return cfg;
  });
  return config;
}

module.exports = withViroAr;
module.exports.addViroToSettings = addViroToSettings;
module.exports.addViroToAppGradle = addViroToAppGradle;
module.exports.addViroToMainApplication = addViroToMainApplication;
module.exports.addViroToManifest = addViroToManifest;
