#!/usr/bin/env bash
set -euo pipefail

SKIP_PORT_CHECKS=0
if [[ "${1:-}" == "--skip-port-checks" ]]; then
  SKIP_PORT_CHECKS=1
fi

ok() { printf '[OK] %s\n' "$1"; }
warn() { printf '[WARN] %s\n' "$1"; }
fail() { printf '[FAIL] %s\n' "$1"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_PATH="${ROOT_DIR}/.env"
HAS_FAILURES=0

printf 'TECHNIEUM preflight checks\n'
printf 'Root: %s\n\n' "${ROOT_DIR}"

if docker info >/dev/null 2>&1; then
  ok 'Docker daemon is available'
else
  fail 'Docker is not available. Start Docker Desktop/Engine and try again.'
  HAS_FAILURES=1
fi

required_files=(
  "${ROOT_DIR}/docker-compose.yml"
  "${ROOT_DIR}/LAB-2/database/init.sql"
  "${ROOT_DIR}/LAB-4/database/init.sql"
  "${ROOT_DIR}/LAB-5/database/init.sql"
  "${ROOT_DIR}/LAB-3/backend/database/seed_data.py"
)

for f in "${required_files[@]}"; do
  if [[ -f "$f" ]]; then
    ok "Found ${f}"
  else
    fail "Missing required file: ${f}"
    HAS_FAILURES=1
  fi
done

if [[ ! -f "${ENV_PATH}" ]]; then
  fail 'Missing .env file at repo root'
  HAS_FAILURES=1
else
  ok "Found ${ENV_PATH}"
  openai_key="$(grep -E '^OPENAI_API_KEY=' "${ENV_PATH}" | sed -E 's/^OPENAI_API_KEY=//')"
  if [[ -z "${openai_key}" ]]; then
    fail 'OPENAI_API_KEY is missing or empty in .env'
    HAS_FAILURES=1
  elif [[ "${openai_key}" =~ ^REPLACE_ ]] || [[ "${openai_key}" =~ YOUR_ ]] || [[ "${openai_key}" == 'sk-...' ]] || [[ "${openai_key}" == '<YOUR_KEY_HERE>' ]]; then
    fail 'OPENAI_API_KEY still uses a placeholder value'
    HAS_FAILURES=1
  else
    ok 'OPENAI_API_KEY is configured'
  fi
fi

if [[ ${SKIP_PORT_CHECKS} -eq 0 ]]; then
  printf '\nChecking common lab ports for conflicts...\n'
  ports=(5555 5000 3000 8000 8080 8083 3001 3100 8090 9000 3200 8100)
  for p in "${ports[@]}"; do
    if command -v ss >/dev/null 2>&1; then
      if ss -ltn "sport = :${p}" | grep -q ":${p}"; then
        warn "Port ${p} is already in use"
      fi
    elif command -v lsof >/dev/null 2>&1; then
      if lsof -iTCP:"${p}" -sTCP:LISTEN >/dev/null 2>&1; then
        warn "Port ${p} is already in use"
      fi
    fi
  done
fi

printf '\n'
if [[ ${HAS_FAILURES} -ne 0 ]]; then
  fail 'Preflight failed. Resolve issues above before running docker compose up.'
  exit 1
fi

ok 'Preflight passed. You can start the platform.'
