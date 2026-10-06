// eslint-disable-next-line @typescript-eslint/no-require-imports
const { addReleaseSigning } = require("../withReleaseSigning");

// The shape `expo prebuild` writes for SDK 52 (trimmed).
const GRADLE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            minifyEnabled enableProguardInReleaseBuilds
        }
    }
}`;

describe("release signing plugin", () => {
  const out: string = addReleaseSigning(GRADLE);
  it("adds a release config read from the environment", () => {
    expect(out).toContain('storeFile file(System.getenv("IRIS_KEYSTORE_PATH"))');
    expect(out).toContain('keyAlias System.getenv("IRIS_KEY_ALIAS")');
  });
  it("signs release with it only when a keystore is provided, and leaves debug alone", () => {
    expect(out).toContain('signingConfig System.getenv("IRIS_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug');
    const debugType = out.slice(out.indexOf("buildTypes {"), out.indexOf("release {", out.indexOf("buildTypes {")));
    expect(debugType).toContain("signingConfig signingConfigs.debug");
  });
  it("is idempotent and refuses a file it does not recognise", () => {
    expect(addReleaseSigning(out)).toBe(out);
    expect(() => addReleaseSigning("android {}")).toThrow(/withReleaseSigning/);
  });
  it("puts no secret in the file", () => {
    expect(out).not.toMatch(/storePassword '(?!android')/);
  });
});
