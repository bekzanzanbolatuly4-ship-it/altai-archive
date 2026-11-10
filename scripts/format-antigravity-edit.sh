#!/usr/bin/env bash
set -euo pipefail

INPUT="$(cat)"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

FILE="$(printf '%s' "$INPUT" | python3 -c '
import json,sys
try:
    data=json.load(sys.stdin)
    args=data.get("toolCall",{}).get("args",{})
    print(args.get("TargetFile") or args.get("file_path") or "")
except Exception:
    print("")
')"

[ -n "$FILE" ] || { printf '{}\n'; exit 0; }

[[ "$FILE" = /* ]] || FILE="$ROOT/$FILE"
FILE="$(realpath -m "$FILE")"

case "$FILE" in "$ROOT"/*) ;; *) printf '{}\n'; exit 0 ;; esac

case "$FILE" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.md|*.mdx) ;;
  *) printf '{}\n'; exit 0 ;;
esac

PRETTIER="$ROOT/node_modules/.bin/prettier"

if [ -x "$PRETTIER" ] && [ -f "$FILE" ]; then
  "$PRETTIER" --write "$FILE" >/dev/null 2>&1 || true
fi

printf '{}\n'
