#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://13.232.249.249}"

required=(
  ":5555/health"
  ":5000/health"
  ":8000/health"
)

optional=(
  ":3000"
  ":8080/health"
  ":8090/health"
  ":9000/health"
  ":3001"
  ":3100"
  ":3200"
  ":8100/health"
)

probe() {
  local url="$1"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$url" || echo 000)
  printf '%s' "$code"
}

failures=0

echo "Required endpoints"
for ep in "${required[@]}"; do
  url="${BASE_URL}${ep}"
  code=$(probe "$url")
  if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
    echo "OK   ${code} ${url}"
  else
    echo "FAIL ${code} ${url}"
    failures=$((failures + 1))
  fi
done

echo
echo "Optional endpoints"
for ep in "${optional[@]}"; do
  url="${BASE_URL}${ep}"
  code=$(probe "$url")
  if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
    echo "OK   ${code} ${url}"
  else
    echo "WARN ${code} ${url}"
  fi
done

if [[ $failures -gt 0 ]]; then
  echo
  echo "Smoke test failed with ${failures} required endpoint failure(s)."
  exit 1
fi

echo
echo "Smoke test passed."
