#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG="${1:-maestro.log}"
SKIPPED_FILE="${SKIPPED_FILE:-demo-skipped.txt}"

maestro test .maestro/demo.yaml 2>&1 | tee "$LOG"

if grep -q "DEMO_AIRDROP_OK=false" "$LOG"; then
  echo "Steps 6–8 (send 0.01 SOL, wallet approve, transaction history)" > "$SKIPPED_FILE"
else
  echo "none" > "$SKIPPED_FILE"
fi
