#!/usr/bin/env bash
# preview.sh — rakenna preview näytedatalla ja avaa se. Nopea design-iterointi.
# Käyttö:  ./preview.sh [data.json]
set -e
cd "$(dirname "$0")"
DATA="${1:-sample-data.json}"
node build.js --data "$DATA" --out preview.pdf
echo "✓ preview.pdf valmis"
# avaa oletuskatselimessa (macOS: open, Linux: xdg-open)
( command -v open >/dev/null && open preview.pdf ) || ( command -v xdg-open >/dev/null && xdg-open preview.pdf ) || true
