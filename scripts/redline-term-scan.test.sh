#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCAN_SCRIPT="$ROOT_DIR/scripts/redline-term-scan.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cat >"$TMP_DIR/affirmative.md" <<'EOF'
# Demo Copy

本页面展示银行放款结果。
EOF

cat >"$TMP_DIR/variant.md" <<'EOF'
# Demo Copy

本页面展示官方CCER交易能力。
EOF

if "$SCAN_SCRIPT" --path "$TMP_DIR/affirmative.md" >/tmp/redline-affirmative.out 2>&1; then
  echo "Expected affirmative red-line wording to fail" >&2
  exit 1
fi

if ! grep -q "银行放款" /tmp/redline-affirmative.out; then
  echo "Expected scan output to include the offending red-line term" >&2
  cat /tmp/redline-affirmative.out >&2
  exit 1
fi

if "$SCAN_SCRIPT" --path "$TMP_DIR/variant.md" >/tmp/redline-variant.out 2>&1; then
  echo "Expected unspaced red-line wording variant to fail" >&2
  exit 1
fi

if ! grep -q "官方CCER交易" /tmp/redline-variant.out; then
  echo "Expected scan output to include the offending unspaced red-line variant" >&2
  cat /tmp/redline-variant.out >&2
  exit 1
fi

cat >"$TMP_DIR/negated.md" <<'EOF'
# Demo Copy

本 Demo 不涉及银行放款。
EOF

cat >"$TMP_DIR/allowlist.txt" <<'EOF'
negated.md:3:银行放款
EOF

"$SCAN_SCRIPT" --path "$TMP_DIR/negated.md" --allowlist "$TMP_DIR/allowlist.txt"

echo "OK: red-line terminology scanner enforces allowlisted negations"
