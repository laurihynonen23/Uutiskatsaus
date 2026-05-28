#!/usr/bin/env bash
set -euo pipefail

# Minimal setup: only need pandoc for MD->HTML conversion.
# curl is preinstalled. No PDF tooling needed.

if ! command -v pandoc >/dev/null 2>&1; then
  sudo apt-get install -y --no-install-recommends pandoc \
    -o Dir::Etc::sourcelist="sources.list" \
    -o Dir::Etc::sourceparts="-" \
    -o APT::Get::List-Cleanup="0" 2>/dev/null || \
  sudo apt-get install -y --no-install-recommends pandoc
fi

echo "[setup] pandoc $(pandoc --version | head -1 | awk '{print $2}') ready"
