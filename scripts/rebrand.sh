#!/usr/bin/env bash
# Deterministic OpenClaw → SunClaw rebrand. Idempotent.
# Usage: ./scripts/rebrand.sh [target_dir]   (defaults to repo root)
set -euo pipefail

TARGET="${1:-.}"
cd "$TARGET"

# Exclusion list: patterns we never touch
EXCLUDE_PATHS=(
  ".git" "node_modules" "dist" "build" "out" ".turbo" ".next"
  "LICENSE" "NOTICE" "tests/fixtures/rebrand"
  "*.lock" "*.png" "*.jpg" "*.jpeg" "*.gif" "*.ico" "*.svg"
  "*.woff" "*.woff2" "*.ttf" "*.eot"
  "*.zip" "*.tar" "*.gz" "*.tgz" "*.bz2"
  "pnpm-lock.yaml" "yarn.lock" "package-lock.json"
)

# Build a `find` pruning expression
prune_args=()
for p in "${EXCLUDE_PATHS[@]}"; do
  prune_args+=(-name "$p" -prune -o)
done

# Find candidate files (text-only, by extension)
mapfile -t FILES < <(
  find . \
    \( "${prune_args[@]}" -false \) -o \
    -type f \( \
      -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o \
      -name "*.mjs" -o -name "*.cjs" -o -name "*.json" -o -name "*.md" -o \
      -name "*.yaml" -o -name "*.yml" -o -name "*.toml" -o -name "*.sh" -o \
      -name "*.html" -o -name "*.css" -o -name "*.scss" -o -name "*.txt" -o \
      -name "Dockerfile*" \
    \) -print
)

# Ordered replacements (longest-first to avoid partial collisions)
REPLACEMENTS=(
  's|https://docs\.openclaw\.ai|https://docs.sunclaw.complex.az|g'
  's|docs\.openclaw\.ai|docs.sunclaw.complex.az|g'
  's|https://clawhub\.ai|https://clawhub.complex.az|g'
  's|clawhub\.ai|clawhub.complex.az|g'
  's|https://openclaw\.ai|https://docs.sunclaw.complex.az|g'
  's|openclaw\.ai|docs.sunclaw.complex.az|g'
  's|github\.com/openclaw/openclaw|github.com/ulvisultanov-art/sunclaw|g'
  's|OpenClaw|SunClaw|g'
  's|openclaw|sunclaw|g'
  's|OPENCLAW|SUNCLAW|g'
)

count=0
for f in "${FILES[@]}"; do
  # Skip if file path contains an excluded fragment
  skip=0
  for p in "${EXCLUDE_PATHS[@]}"; do
    case "$f" in *"$p"*) skip=1; break;; esac
  done
  [[ "$skip" == 1 ]] && continue

  # Apply each sed replacement
  for r in "${REPLACEMENTS[@]}"; do
    sed -i.bak "$r" "$f"
  done
  rm -f "$f.bak"
  count=$((count + 1))
done

echo "Rebranded $count files."
