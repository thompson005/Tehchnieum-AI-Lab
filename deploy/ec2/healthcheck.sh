#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=${1:-/opt/technieum-ai-lab}
BASE_URL=${2:-http://localhost}

cd "${APP_DIR}"

# Wait for containers to stabilise.
echo "Waiting for containers to stabilise..."
for attempt in $(seq 1 40); do
  unhealthy=0

  for cid in $(docker compose ps -q 2>/dev/null); do
    status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "unknown")
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "none")

    # restarting is acceptable — container is recovering
    if [ "$status" != "running" ] && [ "$status" != "restarting" ] && [ "$status" != "created" ]; then
      unhealthy=1
    fi
    if [ "$health" = "unhealthy" ]; then
      unhealthy=1
    fi
  done

  if [ "$unhealthy" -eq 0 ]; then
    echo "All containers running."
    break
  fi

  if [ "$attempt" -eq 40 ]; then
    echo "WARNING: Some containers have not stabilised after 320s — proceeding to endpoint checks."
    docker compose ps
    break
  fi

  sleep 8
done

probe_endpoint() {
  local endpoint="$1"
  local retries="${2:-18}"
  local ok=0
  for attempt in $(seq 1 "$retries"); do
    if curl -fsS --max-time 10 "$endpoint" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 5
  done
  echo "$ok"
}

# ─── Required endpoints (failure blocks deploy) ────────────────────────────
deploy_ok=1
for endpoint in \
  "${BASE_URL}:5555/health" \
  "${BASE_URL}:5000/health" \
  "${BASE_URL}:8000/health"
do
  if [ "$(probe_endpoint "$endpoint" 18)" -ne 1 ]; then
    echo "FAIL: required endpoint unreachable: $endpoint"
    deploy_ok=0
  else
    echo "OK:   $endpoint"
  fi
done

if [ "$deploy_ok" -ne 1 ]; then
  echo "One or more required endpoints are down. Deploy failed."
  exit 1
fi

# ─── Optional endpoints (warnings only) ────────────────────────────────────
for endpoint in \
  "${BASE_URL}:3000" \
  "${BASE_URL}:8080/health" \
  "${BASE_URL}:8090/health" \
  "${BASE_URL}:9000/health" \
  "${BASE_URL}:3001" \
  "${BASE_URL}:3100" \
  "${BASE_URL}:3200" \
  "${BASE_URL}:8100/health"
do
  if [ "$(probe_endpoint "$endpoint" 12)" -ne 1 ]; then
    echo "WARN: optional endpoint not yet reachable: $endpoint"
  else
    echo "OK:   $endpoint"
  fi
done

echo "Core service checks passed."
