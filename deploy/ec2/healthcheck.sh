#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=${1:-/opt/technieum-ai-lab}
BASE_URL=${2:-http://localhost}

cd "${APP_DIR}"

# Wait for all containers to reach a stable running state.
# Skips the immediate "exited" check that was too aggressive for containers
# that briefly restart during startup (race with DB health checks etc.).
echo "Waiting for containers to stabilise..."
for attempt in $(seq 1 40); do
  unhealthy=0
  exited_names=""

  for cid in $(docker compose ps -q 2>/dev/null); do
    status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "unknown")
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "none")
    name=$(docker inspect -f '{{.Name}}' "$cid" 2>/dev/null | sed 's|/||')

    # restarting is acceptable — container is recovering
    if [ "$status" = "exited" ]; then
      exited_names="${exited_names} ${name}(exited)"
      unhealthy=1
    elif [ "$status" != "running" ] && [ "$status" != "restarting" ]; then
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
    echo "Some containers did not stabilise after 320s:${exited_names}"
    docker compose ps
    # Don't exit — proceed to endpoint checks; individual endpoints will tell us what's wrong.
    break
  fi

  sleep 8
done

# ─── Endpoint probes ───────────────────────────────────────────────────────
# Core services (failure here blocks the deploy).
core_ok=1
for endpoint in \
  "${BASE_URL}:5555" \
  "${BASE_URL}:5000" \
  "${BASE_URL}:3000" \
  "${BASE_URL}:8000/health"
do
  ok=0
  for attempt in $(seq 1 18); do
    if curl -fsS --max-time 10 "$endpoint" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 5
  done
  if [ "$ok" -ne 1 ]; then
    echo "CORE endpoint check failed: $endpoint"
    core_ok=0
  fi
done

if [ "$core_ok" -ne 1 ]; then
  echo "One or more CORE endpoints are down. Deploy failed."
  exit 1
fi

# Optional/slow services (log failures but don't block deploy).
for endpoint in \
  "${BASE_URL}:8080/health" \
  "${BASE_URL}:8090/health" \
  "${BASE_URL}:3100" \
  "${BASE_URL}:3200" \
  "${BASE_URL}:8100/health"
do
  ok=0
  for attempt in $(seq 1 24); do
    if curl -fsS --max-time 10 "$endpoint" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 5
  done
  if [ "$ok" -ne 1 ]; then
    echo "WARNING: optional endpoint unreachable (may still be starting): $endpoint"
  else
    echo "OK: $endpoint"
  fi
done

echo "Core service checks passed."
