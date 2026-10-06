// Release signing from the environment, never from the repo.
//
// `expo prebuild` writes android/app/build.gradle with the release build
// signed by the debug key. This adds a `release` signing config that reads
// IRIS_KEYSTORE_PATH / IRIS_KEYSTORE_PASSWORD / IRIS_KEY_ALIAS /
// IRIS_KEY_PASSWORD, and uses it when IRIS_KEYSTORE_PATH is set (CI release
// job). Without it — local and PR builds — release falls back to debug signing.
const { withAppBuildGradle } = require("expo/config-plugins");

const RELEASE_CONFIG = `
        release {
            if (System.getenv("IRIS_KEYSTORE_PATH")) {
                storeFile file(System.getenv("IRIS_KEYSTORE_PATH"))
                storePassword System.getenv("IRIS_KEYSTORE_PASSWORD")
                keyAlias System.getenv("IRIS_KEY_ALIAS")
                keyPassword System.getenv("IRIS_KEY_PASSWORD")
            }
        }`;

function addReleaseSigning(gradle) {
  if (gradle.includes("IRIS_KEYSTORE_PATH")) return gradle;
  const withConfig = gradle.replace(/signingConfigs\s*\{/, (m) => `${m}${RELEASE_CONFIG}`);
  const buildTypes = withConfig.indexOf("buildTypes {");
  if (withConfig === gradle || buildTypes < 0) {
    throw new Error("withReleaseSigning: android/app/build.gradle has no signingConfigs/buildTypes block to patch");
  }
  const head = withConfig.slice(0, buildTypes);
  const tail = withConfig.slice(buildTypes);
  const patched = tail.replace(
    /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
    '$1signingConfig System.getenv("IRIS_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
  );
  if (patched === tail) throw new Error("withReleaseSigning: release buildType signingConfig not found");
  return head + patched;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = addReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};
module.exports.addReleaseSigning = addReleaseSigning;
