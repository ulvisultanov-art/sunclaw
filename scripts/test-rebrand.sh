#!/usr/bin/env bash
# TDD test: runs rebrand.sh on each fixture input, diffs against expected output.
# Exits 0 on full match, 1 on any diff. Used in CI.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_DIR="$REPO_ROOT/tests/fixtures/rebrand"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cp -r "$FIXTURE_DIR/input/." "$TMP/"
# rename .in → real name
for f in "$TMP"/*.in; do mv "$f" "${f%.in}"; done

# Run the rebrand script (will be written in Task 3)
"$REPO_ROOT/scripts/rebrand.sh" "$TMP"

# Compare each output to expected
fail=0
for expected in "$FIXTURE_DIR/expected"/*.out; do
  name=$(basename "$expected" .out)
  actual="$TMP/$name"
  if ! diff -u "$expected" "$actual" > /tmp/rebrand-diff.txt; then
    echo "FAIL: $name"
    cat /tmp/rebrand-diff.txt
    fail=1
  else
    echo "PASS: $name"
  fi
done

exit $fail
