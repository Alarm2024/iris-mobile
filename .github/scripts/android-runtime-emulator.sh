#!/usr/bin/env bash
# Build/install the release APK from this commit and run android-runtime Maestro smoke.
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"
APK="${IRIS_APK:-$ROOT/android/app/build/outputs/apk/release/app-release.apk}"

show_screen() {
  echo "::group::Screen at failure"
  adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp' || true
  if adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; then
    adb shell cat /sdcard/ui.xml | grep -oE '(text|resource-id|content-desc)="[^"]+"' || true
  fi
  echo "::endgroup::"
}

if [[ ! -s "$APK" ]]; then
  echo "::error::Release APK missing at $APK"
  exit 1
fi

adb install -r "$APK"
adb shell pm grant dev.elghaly.irisdeskvoice android.permission.RECORD_AUDIO || true
adb logcat -c
adb shell am start -W -S -n dev.elghaly.irisdeskvoice/.MainActivity || true

curl -fsSL "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"

if ! maestro test "$ROOT/.maestro/android-runtime-launch.yaml" --debug-output "$RUNNER_TEMP/maestro-android-runtime-launch"; then
  show_screen
  exit 1
fi

echo "30s idle on Voice (no crash)…"
sleep 30
if ! adb shell pidof dev.elghaly.irisdeskvoice >/dev/null 2>&1; then
  echo "::error::Iris exited during 30s idle"
  show_screen
  exit 1
fi

if ! maestro test "$ROOT/.maestro/android-runtime-smoke.yaml" --debug-output "$RUNNER_TEMP/maestro-android-runtime"; then
  show_screen
  exit 1
fi

echo "android-runtime smoke passed"