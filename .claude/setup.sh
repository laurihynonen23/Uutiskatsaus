#!/usr/bin/env bash
set -euo pipefail

# Install pandoc if missing
if ! command -v pandoc >/dev/null 2>&1; then
  sudo apt-get install -y --no-install-recommends pandoc 2>/dev/null || true
fi

echo "[setup] ready (pandoc $(pandoc --version 2>/dev/null | head -1 | awk '{print $2}'))"
