#!/usr/bin/env bash
set -Eeuo pipefail

REPO_URL=${1:?"usage: deploy.sh <repo_url> [branch] [app_dir] [rollback_sha]"}
BRANCH=${2:-main}
APP_DIR=${3:-/home/ubuntu/ai-labs}
ROLLBACK_SHA=${4:-}

# Keep image build/extract pressure low on single-disk EC2 hosts.
export COMPOSE_PARALLEL_LIMIT=${COMPOSE_PARALLEL_LIMIT:-1}

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed on this host" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose plugin is required" >&2
  exit 1
fi

if [ ! -d "${APP_DIR}/.git" ]; then
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone --branch "${BRANCH}" --depth 1 "${REPO_URL}" "${APP_DIR}"
fi

cd "${APP_DIR}"
git fetch origin "${BRANCH}" --tags

if [ -n "${ROLLBACK_SHA}" ]; then
  echo "Deploying rollback SHA ${ROLLBACK_SHA}"
  git checkout --detach "${ROLLBACK_SHA}"
else
  git checkout "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
fi

if [ ! -f ".env" ]; then
  echo "Missing ${APP_DIR}/.env. Create it from .env.example before deploy." >&2
  exit 1
fi

# Validate compose syntax before replacing running containers.
docker compose config >/dev/null

# Pull newer base images when available, but continue if an image is build-only.
docker compose pull --ignore-pull-failures || true

# Free up disk space (dangling images + stopped containers) before building.
# Note: intentionally NOT pruning volumes to preserve database data.
docker system prune -f || true

# Rebuild and apply updates.
docker compose up -d --build --remove-orphans

# Keep last deployed reference for manual rollback auditing.
git rev-parse HEAD > .last_deployed_sha

docker image prune -f >/dev/null 2>&1 || true

echo "Deployment completed at commit $(cat .last_deployed_sha)"
