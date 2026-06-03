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
  "rebrand.sh" "test-rebrand.sh" "upstream-merge.sh"
)

# Path-anchored exclusions (relative to TARGET, no leading "./"). These files
# legitimately keep OpenClaw references for MIT fork-attribution reasons and
# MUST NOT be rewritten by the rebrand pass. The list intentionally mirrors
# the survivor-scan allowlist in .github/workflows/sunclaw-fork.yml so the
# two stay in lockstep across upstream syncs.
#
# These exclusions ONLY apply when running against the real fork repo (the
# presence of TARGET/.git is the signal). When running against arbitrary trees
# -- notably the rebrand fixture suite at tests/fixtures/rebrand/, which has
# its own README.md fixture pair -- the exclusions are disabled so the fixture
# tests remain a faithful end-to-end check of the replacement rules.
EXCLUDE_PATHS=(
  "README.md"                                # slim fork README ("Forked from OpenClaw...")
  "UPSTREAM.md"                              # pin file: names upstream by definition
  "CHANGELOG.md"                             # SunClaw entry attributes upstream
  "docs/sunclaw"                             # ADRs + upstream-mirror README
  ".github/workflows/sunclaw-fork.yml"       # contains the allowlist literals
)

# Disable path-anchored exclusions when not running against the actual fork
# repo (e.g. inside the fixture sandbox under tests/fixtures/rebrand/).
if [ ! -d ".git" ]; then
  EXCLUDE_PATHS=()
fi

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
      -name "*.jsonl" -o -name "*.ps1" -o -name "*.mts" -o -name "*.cts" -o \
      -name "*.webmanifest" -o -name "*.service" -o -name "*.timer" -o \
      -name "*.in" -o -name "*.example" -o -name "*.xcfilelist" -o \
      -name "Dockerfile*" -o -name "*.Dockerfile" -o -name "Makefile*" -o \
      -name ".gitignore" -o -name ".dockerignore" -o \
      -name "CODEOWNERS" -o -name "Appfile" -o -name "Fastfile" -o \
      -name "agent-transcript" -o \
      -name "go.mod" -o -name "go.sum" -o -name "go.work" \
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
  # Externally-owned npm packages — Anthropic still publishes these
  # under the @openclaw scope, so we must NOT rebrand them. Restore.
  's|@sunclaw/fs-safe|@openclaw/fs-safe|g'
  's|@sunclaw/proxyline|@openclaw/proxyline|g'
)

skip_file() {
  local path="$1"
  # Normalize leading "./" so EXCLUDE_PATHS entries can be plain relative paths.
  local rel="${path#./}"
  local base
  base="$(basename "$path")"
  for n in "${EXCLUDE_FILENAMES[@]}"; do
    [[ "$base" == "$n" ]] && return 0
  done
  for g in "${EXCLUDE_GLOBS[@]}"; do
    # shellcheck disable=SC2053
    [[ "$base" == $g ]] && return 0
  done
  for p in "${EXCLUDE_PATHS[@]}"; do
    # Exact-path match (single-file allowlist entry).
    [[ "$rel" == "$p" ]] && return 0
    # Prefix match for directory entries: any file under that directory.
    [[ "$rel" == "$p"/* ]] && return 0
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
