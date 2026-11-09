#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FAILED=0

has_script() {
  node -e "const s=require('./package.json').scripts||{}; process.exit(s['$1'] ? 0 : 1)"
}

run_check() {
  local name="$1"
  local required="${2:-no}"

  if ! has_script "$name"; then
    echo "SKIP: $name (not configured)"
    if [ "$required" = "yes" ]; then FAILED=1; fi
    return
  fi

  echo
  echo "===== $name ====="
  if npm run "$name"; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    FAILED=1
  fi
}

run_check typecheck yes
run_check lint yes
run_check format:check no
run_check test no
run_check test:e2e no
run_check build yes

echo
if [ "$FAILED" -eq 0 ]; then
  echo "QUALITY GATE: PASSED (configured checks only)"
else
  echo "QUALITY GATE: FAILED OR REQUIRED CHECK MISSING"
fi

exit "$FAILED"
