#!/usr/bin/env bash
# Runs the in-browser test suites headless with Chrome.
# Usage: bash scripts/test.sh [suite]      e.g. bash scripts/test.sh F001
# Prints only the PASS / FAIL / RESULT lines; exit 0 only if a "RESULT: PASS" line exists.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUITE="${1:-}"

find_chrome() {
  if [ -n "${CHROME:-}" ]; then
    echo "$CHROME"
    return 0
  fi
  local mac="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [ -x "$mac" ]; then
    echo "$mac"
    return 0
  fi
  local name
  for name in google-chrome google-chrome-stable chromium; do
    if command -v "$name" >/dev/null 2>&1; then
      command -v "$name"
      return 0
    fi
  done
  return 1
}

if ! CHROME_BIN="$(find_chrome)"; then
  echo "FAIL chrome :: Chrome not found (set CHROME or install Google Chrome)"
  echo "RESULT: FAIL no result (runner did not finish)"
  exit 1
fi

URL="file://${ROOT// /%20}/tests/index.html"
if [ -n "$SUITE" ]; then
  URL="${URL}?suite=${SUITE}"
fi

# A throwaway profile keeps the run independent of any open Chrome window.
PROFILE_DIR="$(mktemp -d)"
OUT_FILE="$(mktemp)"
trap 'rm -rf "$PROFILE_DIR" "$OUT_FILE"' EXIT

FLAGS=(
  --headless=new
  --allow-file-access-from-files
  --virtual-time-budget=10000
  --window-size=1400,1000
  --dump-dom
  --user-data-dir="$PROFILE_DIR"
  --no-first-run
  --disable-gpu
)
if [ "${CI:-}" = "true" ]; then
  FLAGS+=(--no-sandbox)
fi

"$CHROME_BIN" "${FLAGS[@]}" "$URL" >"$OUT_FILE" 2>/dev/null &
CHROME_PID=$!
# Watchdog: never hang forever if Chrome stalls.
( sleep 90; kill "$CHROME_PID" ) >/dev/null 2>&1 &
WATCHDOG_PID=$!
wait "$CHROME_PID" 2>/dev/null
pkill -P "$WATCHDOG_PID" 2>/dev/null
kill "$WATCHDOG_PID" 2>/dev/null

LINES="$(
  sed -E 's/^.*<pre id="results">//; s#</pre>.*$##' "$OUT_FILE" \
    | grep -E '^(PASS|FAIL|RESULT)' \
    | sed -e 's/&lt;/</g' -e 's/&gt;/>/g' -e 's/&quot;/"/g' -e "s/&#39;/'/g" -e 's/&amp;/\&/g'
)"

if ! printf '%s\n' "$LINES" | grep -q '^RESULT:'; then
  [ -n "$LINES" ] && printf '%s\n' "$LINES"
  echo "RESULT: FAIL no result (runner did not finish)"
  exit 1
fi

printf '%s\n' "$LINES"
if printf '%s\n' "$LINES" | grep -q '^RESULT: PASS'; then
  exit 0
fi
exit 1
