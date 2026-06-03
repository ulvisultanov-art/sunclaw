#!/usr/bin/env bash
set -euo pipefail

cd /repo

export SUNCLAW_STATE_DIR="/tmp/sunclaw-test"
export SUNCLAW_CONFIG_PATH="${SUNCLAW_STATE_DIR}/sunclaw.json"

echo "==> Build"
if ! pnpm build >/tmp/sunclaw-cleanup-build.log 2>&1; then
  cat /tmp/sunclaw-cleanup-build.log
  exit 1
fi

echo "==> Seed state"
mkdir -p "${SUNCLAW_STATE_DIR}/credentials"
mkdir -p "${SUNCLAW_STATE_DIR}/agents/main/sessions"
echo '{}' >"${SUNCLAW_CONFIG_PATH}"
echo 'creds' >"${SUNCLAW_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${SUNCLAW_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
if ! pnpm sunclaw reset --scope config+creds+sessions --yes --non-interactive >/tmp/sunclaw-cleanup-reset.log 2>&1; then
  cat /tmp/sunclaw-cleanup-reset.log
  exit 1
fi

test ! -f "${SUNCLAW_CONFIG_PATH}"
test ! -d "${SUNCLAW_STATE_DIR}/credentials"
test ! -d "${SUNCLAW_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${SUNCLAW_STATE_DIR}/credentials"
echo '{}' >"${SUNCLAW_CONFIG_PATH}"

echo "==> Uninstall (state only)"
if ! pnpm sunclaw uninstall --state --yes --non-interactive >/tmp/sunclaw-cleanup-uninstall.log 2>&1; then
  cat /tmp/sunclaw-cleanup-uninstall.log
  exit 1
fi

test ! -d "${SUNCLAW_STATE_DIR}"

echo "OK"
