#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_files=(
  "docker-compose.yml"
  "backend/services/Dockerfile"
  "web/Dockerfile"
  "scripts/regional-demo-static-fixture.sh"
  "scripts/regional-dashboard-static-fixture.test.sh"
  "docs/demo-operator-guide.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "${ROOT_DIR}/${file}" ]]; then
    echo "Missing offline demo prerequisite: ${file}" >&2
    exit 1
  fi
done

bash "${ROOT_DIR}/scripts/redline-term-scan.sh"
bash "${ROOT_DIR}/scripts/regional-dashboard-static-fixture.test.sh"

if ! grep -q 'PORT="${PORT:-3030}"' "${ROOT_DIR}/web/docker-entrypoint.sh"; then
  echo "web docker entrypoint must keep a PORT fallback for local/offline runs" >&2
  exit 1
fi

if ! grep -q 'VITE_REGIONAL_MARKET_API_BASE' "${ROOT_DIR}/web/Dockerfile"; then
  echo "web Dockerfile must preserve regional API override support" >&2
  exit 1
fi

if ! grep -q "复位演示" "${ROOT_DIR}/docs/demo-operator-guide.md"; then
  echo "operator guide must include reset recovery steps" >&2
  exit 1
fi

echo "regional demo offline smoke passed"
