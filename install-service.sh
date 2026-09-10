#!/usr/bin/env bash
# Installs start.sh as a systemd service so the Tech Show HTTP server survives
# reboots and crashes. Run with sudo from wherever this repo lives
# (e.g. /srv/BTTechExpo2026 in production).
#
# Usage:
#   sudo ./install-service.sh             install + enable (not started)
#   sudo ./install-service.sh --start      install + enable + start now
#   sudo ./install-service.sh --no-enable  install only, skip enable/start
#   sudo ./install-service.sh --uninstall  stop, disable, remove the unit
#
# Env overrides:
#   SERVICE_USER=someuser   user the service runs as (default: invoker of sudo)
set -euo pipefail

SERVICE_NAME="bttechexpo2026"
UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="${APP_DIR}/start.sh"

ENABLE=1
START=0
UNINSTALL=0

for arg in "$@"; do
  case "$arg" in
    --start) START=1 ;;
    --no-enable) ENABLE=0 ;;
    --uninstall) UNINSTALL=1 ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

if [[ "$(id -u)" -ne 0 ]]; then
  echo "This script must be run with sudo/root." >&2
  exit 1
fi

if [[ "$UNINSTALL" -eq 1 ]]; then
  echo "Stopping and disabling ${SERVICE_NAME}..."
  systemctl stop "${SERVICE_NAME}.service" 2>/dev/null || true
  systemctl disable "${SERVICE_NAME}.service" 2>/dev/null || true
  rm -f "$UNIT_PATH"
  systemctl daemon-reload
  echo "Removed ${UNIT_PATH}."
  exit 0
fi

if [[ ! -x "$START_SCRIPT" ]]; then
  echo "Expected executable start.sh at ${START_SCRIPT}" >&2
  exit 1
fi

RUN_USER="${SERVICE_USER:-${SUDO_USER:-}}"
if [[ -z "$RUN_USER" || "$RUN_USER" == "root" ]]; then
  echo "Refusing to run the service as root. Set SERVICE_USER=<user> and re-run." >&2
  exit 1
fi

echo "Installing ${UNIT_PATH}"
echo "  ExecStart: ${START_SCRIPT}"
echo "  User:      ${RUN_USER}"

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=BT Tech Expo 2026 kiosk web server
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
ExecStart=${START_SCRIPT}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

chmod 644 "$UNIT_PATH"
systemctl daemon-reload

if [[ "$ENABLE" -eq 1 ]]; then
  systemctl enable "${SERVICE_NAME}.service"
fi

if [[ "$START" -eq 1 ]]; then
  systemctl start "${SERVICE_NAME}.service"
  systemctl status "${SERVICE_NAME}.service" --no-pager
else
  echo "Service installed. Start it with: sudo systemctl start ${SERVICE_NAME}"
fi
