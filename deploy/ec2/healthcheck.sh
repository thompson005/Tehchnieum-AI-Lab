#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=${1:-/opt/technieum-ai-lab}
BASE_URL=${2:-http://localhost}

cd "${APP_DIR}"

# Wait for services to become running/healthy.
for attempt in $(seq 1 20); do
  if [ -n "$(docker compose ps --services --status exited)" ]; then
    echo "Found exited containers."
    docker compose ps
    exit 1
  fi

  unhealthy=0
  for cid in $(docker compose ps -q); do
    status=$(docker inspect -f '{{.State.Status}}' "$cid")
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid")

    if [ "$status" != "running" ]; then
      unhealthy=1
      break
    fi

    if [ "$health" = "unhealthy" ]; then
      unhealthy=1
      break
    fi
  done

  if [ "$unhealthy" -eq 0 ]; then
    break
  fi

  if [ "$attempt" -eq 20 ]; then
    echo "Services did not reach healthy state in time."
    docker compose ps
    exit 1
  fi

  sleep 8
done

# Basic endpoint probes for major entry points.
for endpoint in \
  "${BASE_URL}:5555" \
  "${BASE_URL}:5000" \
  "${BASE_URL}:3000" \
  "${BASE_URL}:8000/health" \
  "${BASE_URL}:8080" \
  "${BASE_URL}:3100" \
  "${BASE_URL}:3200" \
  "${BASE_URL}:8100/health"
do
  ok=0
  for attempt in $(seq 1 12); do
    if curl -fsS --max-time 10 "$endpoint" >/dev/null 2>&1; then
      ok=1
      break
    fi
    sleep 5
  done

  if [ "$ok" -ne 1 ]; then
    echo "Endpoint check failed: $endpoint"
    exit 1
  fi
done

echo "All service checks passed."
