#!/usr/bin/env bash
# README demo script (steps 1–9) on a booted emulator, typed input, screen recording.
set -euo pipefail

IRIS_APK_URL="${IRIS_APK_URL:-https://github.com/Alarm2024/iris-mobile/releases/download/v0.1.0/iris-desk-voice-v0.1.0.apk}"
FAKEWALLET_APK="${FAKEWALLET_APK:?FAKEWALLET_APK must point to a built fakewallet APK}"
ALICE_ADDRESS="${ALICE_ADDRESS:-9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin}"
RECORD_LIMIT="${RECORD_LIMIT:-170}"
DEMO_MP4="${DEMO_MP4:-demo.mp4}"

curl -fsSL -o "$RUNNER_TEMP/iris.apk" "$IRIS_APK_URL"
adb install -r "$RUNNER_TEMP/iris.apk"
adb install -r "$FAKEWALLET_APK"
adb shell pm grant dev.elghaly.irisdeskvoice android.permission.RECORD_AUDIO || true

curl -fsSL "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"

# Before recording: a run-only fakewallet seed, funded from the devnet faucet
# when it agrees. A refusal is not an error; the demo then shows the no-funds path.
maestro test .maestro/steps/fakewallet-fund.yaml || echo "::warning::fakewallet funding flow failed; recording without pre-funding"

# 720x1600 keeps the pixel_6 aspect ratio inside the emulator encoder's limits.
adb shell screenrecord --time-limit "$RECORD_LIMIT" --size 720x1600 --bit-rate 4000000 /sdcard/iris-demo.mp4 &
RECORD_PID=$!

finish_recording() {
  adb shell pkill -INT screenrecord 2>/dev/null || true
  sleep 4
  adb pull /sdcard/iris-demo.mp4 "$DEMO_MP4"
}

trap finish_recording EXIT

maestro test .maestro/demo.yaml -e "ALICE_ADDRESS=$ALICE_ADDRESS"

wait "$RECORD_PID" 2>/dev/null || true
finish_recording
trap - EXIT

if [[ ! -s "$DEMO_MP4" ]]; then
  echo "::error::screen recording missing or empty"
  exit 1
fi

DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$DEMO_MP4" | awk '{printf "%.1f", $1}')"
echo "DEMO_MP4_SECONDS=$DURATION" >> "${GITHUB_ENV:-/dev/null}"
echo "Demo recording length: ${DURATION}s"
