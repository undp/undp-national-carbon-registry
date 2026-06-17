#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ALLOWLIST_FILE="$ROOT_DIR/docs/regional-carbon-market/redline-term-allowlist.txt"
PATHS=()

usage() {
  cat <<'USAGE'
Usage: scripts/redline-term-scan.sh [--path PATH ...] [--allowlist FILE]

Scans user-facing demo copy, regional docs, and regional implementation files
for phase-zero red-line terms. Use allowlist entries only for explicit
negations, quotations, or boundary statements.

Allowlist formats:
  path-fragment|term|reason
  basename:line:term
  path:line:term
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      [[ $# -ge 2 ]] || { echo "--path requires a value" >&2; exit 2; }
      PATHS+=("$2")
      shift 2
      ;;
    --allowlist)
      [[ $# -ge 2 ]] || { echo "--allowlist requires a value" >&2; exit 2; }
      ALLOWLIST_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ${#PATHS[@]} -eq 0 ]]; then
  PATHS=(
    "$ROOT_DIR/web/src"
    "$ROOT_DIR/backend/services/libs/shared/src/regional-market"
    "$ROOT_DIR/docs/regional-carbon-market"
    "$ROOT_DIR/docs/plans"
    "$ROOT_DIR/scripts"
  )
fi

REDLINE_PATTERNS=(
  "官方 CCER 交易|官方 CCER 交易"
  "官方 CCER交易|官方 CCER 交易"
  "官方CCER 交易|官方 CCER 交易"
  "官方CCER交易|官方 CCER 交易"
  "核证自愿减排量交易|核证自愿减排量交易"
  "真实登记结算|真实登记结算"
  "真实清算|真实清算"
  "银行放款|银行放款"
  "法律有效电子合同|法律有效电子合同"
  "官方预警|官方预警"
  "交易账户真实持仓|交易账户真实持仓"
  "交易平台正式上线|交易平台正式上线"
)

is_allowlisted() {
  local file="$1"
  local line="$2"
  local term="$3"
  local base
  base="$(basename "$file")"

  [[ -f "$ALLOWLIST_FILE" ]] || return 1

  while IFS= read -r entry || [[ -n "$entry" ]]; do
    [[ -z "$entry" || "$entry" =~ ^[[:space:]]*# ]] && continue

    if [[ "$entry" == *"|"* ]]; then
      IFS='|' read -r path_fragment allowed_term _reason <<<"$entry"
      if [[ "$file" == *"$path_fragment"* && "$term" == "$allowed_term" ]]; then
        return 0
      fi
      if [[ "$base" == *"$path_fragment"* && "$term" == "$allowed_term" ]]; then
        return 0
      fi
      continue
    fi

    if [[ "$entry" == "$file:$line:$term" || "$entry" == "$base:$line:$term" ]]; then
      return 0
    fi
  done <"$ALLOWLIST_FILE"

  return 1
}

failures=()
RG_EXCLUDES=(
  --glob '!**/scripts/redline-term-scan.sh'
  --glob '!**/scripts/redline-term-scan.test.sh'
  --glob '!**/docs/regional-carbon-market/redline-term-allowlist.txt'
)

for pattern_entry in "${REDLINE_PATTERNS[@]}"; do
  pattern="${pattern_entry%%|*}"
  canonical_term="${pattern_entry#*|}"
  while IFS= read -r hit || [[ -n "$hit" ]]; do
    [[ -z "$hit" ]] && continue

    file="${hit%%:*}"
    rest="${hit#*:}"
    line="${rest%%:*}"
    content="${rest#*:}"

    if ! is_allowlisted "$file" "$line" "$canonical_term"; then
      failures+=("$file:$line: red-line term '$pattern' -> $content")
    fi
  done < <(rg --fixed-strings --line-number --with-filename --no-heading --color never "${RG_EXCLUDES[@]}" "$pattern" "${PATHS[@]}" 2>/dev/null || true)
done

if [[ ${#failures[@]} -gt 0 ]]; then
  printf '%s\n' "Red-line terminology scan failed:"
  printf '%s\n' "${failures[@]}"
  exit 1
fi

echo "OK: no unallowlisted red-line terminology found"
