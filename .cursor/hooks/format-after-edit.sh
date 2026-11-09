#!/usr/bin/env bash
set -euo pipefail

ROOT="${CURSOR_PROJECT_DIR:-$(pwd)}"
FILE="$(python3 -c '
import json,sys
try:
    print(json.load(sys.stdin).get("file_path",""))
except Exception:
    print("")
')"

[ -n "$FILE" ] || exit 0

case "$FILE" in
  "$ROOT"/*) ;;
  *) exit 0 ;;
esac

case "$FILE" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.md|*.mdx) ;;
  *) exit 0 ;;
esac

PRETTIER="$ROOT/node_modules/.bin/prettier"
[ -x "$PRETTIER" ] || exit 0

"$PRETTIER" --write "$FILE" >/dev/null 2>&1 || exit 0
