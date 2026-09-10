#!/usr/bin/env bash
# Serves this folder over HTTP so the Tech Show page can be opened from any
# device on the network (the kiosk touchscreen, a laptop, a phone for testing).
set -euo pipefail

PORT=7029
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DIR"
echo "Serving $DIR on http://0.0.0.0:$PORT (open http://localhost:$PORT on this machine)"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
