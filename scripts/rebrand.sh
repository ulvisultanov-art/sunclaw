#!/usr/bin/env bash
# Deterministic OpenClaw → SunClaw rebrand. Idempotent.
# Usage: ./scripts/rebrand.sh [target_dir]   (defaults to repo root)
set -euo pipefail

TARGET="${1:-.}"
cd "$TARGET"

# Directory names to prune from `find` (path-component match, not substring).
EXCLUDE_DIRS=(
  ".git" "node_modules" "dist" "build" "out" ".turbo" ".next"
  ".pnpm" ".cache" "coverage" ".vercel" "tests/fixtures/rebrand"
)

# Exact filenames to skip.
EXCLUDE_FILENAMES=(
  "LICENSE" "NOTICE" "pnpm-lock.yaml" "yarn.lock" "package-lock.json"
  "rebrand.sh" "test-rebrand.sh"
)

# File-name globs to skip (binary / lock formats).
EXCLUDE_GLOBS=(
  "*.lock" "*.png" "*.jpg" "*.jpeg" "*.gif" "*.ico" "*.svg"
  "*.woff" "*.woff2" "*.ttf" "*.eot" "*.icns"
  "*.zip" "*.tar" "*.gz" "*.tgz" "*.bz2" "*.xz" "*.7z"
)

# Build `find` pruning args for directories.
prune_args=()
for d in "${EXCLUDE_DIRS[@]}"; do
  prune_args+=(-path "*/$d" -prune -o)
done

# File extensions we rebrand. Source + config + mobile + docs.
mapfile -t FILES < <(
  find . \
    \( "${prune_args[@]}" -false \) -o \
    -type f \( \
      -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o \
      -name "*.mjs" -o -name "*.cjs" -o -name "*.json" -o -name "*.md" -o \
      -name "*.mdx" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" -o \
      -name "*.sh" -o -name "*.bash" -o -name "*.html" -o -name "*.htm" -o \
      -name "*.css" -o -name "*.scss" -o -name "*.txt" -o -name "*.env*" -o \
      -name "*.swift" -o -name "*.kt" -o -name "*.kts" -o -name "*.gradle" -o \
      -name "*.xml" -o -name "*.plist" -o -name "*.xcconfig" -o -name "*.pbxproj" -o \
      -name "*.go" -o -name "*.py" -o -name "*.rs" -o -name "*.ql" -o -name "*.lobster" -o \
      -name "Dockerfile*" -o -name "Makefile*" -o -name ".gitignore" -o -name ".dockerignore" \
    \) -print
)

# Ordered replacements (longest-first to avoid partial collisions).
REPLACEMENTS=(
  's|https://docs\.openclaw\.ai|https://docs.sunclaw.complex.az|g'
  's|docs\.openclaw\.ai|docs.sunclaw.complex.az|g'
  's|https://clawhub\.ai|https://clawhub.complex.az|g'
  's|clawhub\.ai|clawhub.complex.az|g'
  's|https://openclaw\.ai|https://docs.sunclaw.complex.az|g'
  's|openclaw\.ai|docs.sunclaw.complex.az|g'
  's|github\.com/openclaw/openclaw|github.com/ulvisultanov-art/sunclaw|g'
  's|OpenClaw|SunClaw|g'
  's|openClaw|sunClaw|g'
  's|Openclaw|Sunclaw|g'
  's|openclaw|sunclaw|g'
  's|OPENCLAW|SUNCLAW|g'
)

skip_file() {
  local path="$1"
  local base
  base="$(basename "$path")"
  for n in "${EXCLUDE_FILENAMES[@]}"; do
    [[ "$base" == "$n" ]] && return 0
  done
  for g in "${EXCLUDE_GLOBS[@]}"; do
    # shellcheck disable=SC2053
    [[ "$base" == $g ]] && return 0
  done
  return 1
}

count=0
for f in "${FILES[@]}"; do
  skip_file "$f" && continue

  for r in "${REPLACEMENTS[@]}"; do
    sed -i.bak "$r" "$f"
  done
  rm -f "$f.bak"
  count=$((count + 1))
done

echo "Rebranded $count files."
