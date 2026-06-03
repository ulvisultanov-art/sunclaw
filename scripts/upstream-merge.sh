#!/usr/bin/env bash
# scripts/upstream-merge.sh -- biweekly OpenClaw -> SunClaw upstream sync helper.
#
# Reads the pinned SHA from UPSTREAM.md, fetches the upstream remote, attempts
# a merge into a fresh sync branch, re-runs the rebrand pipeline + fixture
# suite + survivor scan, and updates UPSTREAM.md to the new pinned SHA.
#
# What this script DOES:
#   - git fetch upstream
#   - create branch upstream-sync-YYYYMMDD (if not present)
#   - git merge --no-ff upstream/main into the sync branch
#   - run scripts/rebrand.sh on the working tree (catches new identifiers)
#   - run scripts/test-rebrand.sh (fixture suite must still pass)
#   - run the survivor scan (same rules the CI workflow enforces)
#   - rewrite the UPSTREAM.md pin to the new tip
#   - commit "chore: re-run rebrand after upstream sync" (allow-empty)
#
# What this script DOES NOT do (intentional -- governed by the no-auto-push
# user rule recorded in memory/feedback_no_auto_github.md):
#   - git push
#   - gh pr create
#   - git tag
#
# After this script finishes, a human (or a follow-up agent given explicit
# permission in the same message) reviews the merge, then pushes / opens PR.
#
# Usage:
#   ./scripts/upstream-merge.sh                              # full sync from upstream/main
#   ./scripts/upstream-merge.sh upstream/release             # override ref
#   ./scripts/upstream-merge.sh --skip-merge                 # post-conflict recovery
#   ./scripts/upstream-merge.sh upstream/main --skip-merge   # ref + flag (either order)
#
# --skip-merge mode: when a previous run hit conflicts, the operator resolved
# them by hand and committed. Re-running without --skip-merge would either bail
# on the dirty-tree pre-flight (if uncommitted) or fail on the already-merged
# branch. --skip-merge bypasses the dirty-tree check, branch creation, and the
# merge step itself -- it picks up at the rebrand / fixture / survivor-scan /
# pin-update sequence. The current branch must already contain the merge.
#
# Exit codes:
#   0  -- merge clean, rebrand idempotent, survivor scan clean, pin updated
#   1  -- merge conflicts (resolve manually, then re-run with --skip-merge)
#   2  -- rebrand pipeline failed after merge (fixture suite or survivor scan)
#   3  -- pre-flight failed (no upstream remote, dirty tree, missing UPSTREAM.md)

set -euo pipefail

# Parse args -- accept --skip-merge and the optional upstream ref in either order.
SKIP_MERGE=0
UPSTREAM_REF=""
for arg in "$@"; do
  case "$arg" in
    --skip-merge)
      SKIP_MERGE=1
      ;;
    -*)
      echo "::error::Unknown flag: $arg" >&2
      echo "Usage: $0 [<upstream-ref>] [--skip-merge]" >&2
      exit 3
      ;;
    *)
      if [ -n "$UPSTREAM_REF" ]; then
        echo "::error::Multiple upstream refs given: '$UPSTREAM_REF' and '$arg'" >&2
        exit 3
      fi
      UPSTREAM_REF="$arg"
      ;;
  esac
done
UPSTREAM_REF="${UPSTREAM_REF:-upstream/main}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ---- Pre-flight ------------------------------------------------------------

if [ ! -f UPSTREAM.md ]; then
  echo "::error::UPSTREAM.md missing -- cannot determine current pin." >&2
  exit 3
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "::error::No 'upstream' git remote configured." >&2
  echo "Run: git remote add upstream https://github.com/openclaw/openclaw.git" >&2
  exit 3
fi

if [ "$SKIP_MERGE" -eq 0 ] && [ -n "$(git status --porcelain)" ]; then
  echo "::error::Working tree is dirty. Commit or stash before syncing." >&2
  echo "(If you are recovering from a previous conflicted merge that has now" >&2
  echo "been resolved and committed, re-run with --skip-merge.)" >&2
  git status --short >&2
  exit 3
fi

# Capture the current pin so we can show the delta in the commit message.
OLD_PIN=$(grep -oE '[0-9a-f]{40}' UPSTREAM.md | head -1 || echo "unknown")

# ---- Fetch + branch --------------------------------------------------------

echo ">>> Fetching upstream..."
git fetch upstream --tags

NEW_SHA=$(git rev-parse "$UPSTREAM_REF")
if [ "$NEW_SHA" = "$OLD_PIN" ] && [ "$SKIP_MERGE" -eq 0 ]; then
  echo "Upstream pin already at $NEW_SHA -- nothing to sync."
  exit 0
fi

if [ "$SKIP_MERGE" -eq 1 ]; then
  SYNC_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo ">>> --skip-merge: resuming on current branch $SYNC_BRANCH."
  echo ">>> Skipping dirty-tree gate, branch creation, and merge step."
else
  SYNC_BRANCH="upstream-sync-$(date +%Y%m%d)"
  if git show-ref --verify --quiet "refs/heads/$SYNC_BRANCH"; then
    echo ">>> Branch $SYNC_BRANCH already exists -- checking it out."
    git checkout "$SYNC_BRANCH"
  else
    echo ">>> Creating $SYNC_BRANCH from main."
    git checkout -b "$SYNC_BRANCH" main
  fi

  # ---- Merge ---------------------------------------------------------------

  echo ">>> Merging $UPSTREAM_REF (was $OLD_PIN -> now $NEW_SHA)..."
  if ! git merge --no-ff "$UPSTREAM_REF" \
      -m "merge: sync from $UPSTREAM_REF (pin $OLD_PIN -> $NEW_SHA)"; then
    echo
    echo "::error::Merge conflicts. Resolve manually, then re-run:" >&2
    echo "  # 1. Edit conflicted files, then:" >&2
    echo "  git add -A && git commit" >&2
    echo "  # 2. Resume the rest of the pipeline:" >&2
    echo "  bash scripts/upstream-merge.sh --skip-merge" >&2
    exit 1
  fi
fi

# ---- Re-apply rebrand + run gates ------------------------------------------

echo ">>> Re-running rebrand on the merged tree..."
bash scripts/rebrand.sh . || {
  echo "::error::scripts/rebrand.sh failed on the merged tree." >&2
  exit 2
}

echo ">>> Running fixture suite..."
bash scripts/test-rebrand.sh || {
  echo "::error::scripts/test-rebrand.sh failed -- rebrand drifted." >&2
  exit 2
}

echo ">>> Running survivor scan (same as CI workflow)..."
if git grep -nIE 'OpenClaw|openclaw|OPENCLAW' -- \
    ':!LICENSE' \
    ':!NOTICE' \
    ':!README.md' \
    ':!UPSTREAM.md' \
    ':!CHANGELOG.md' \
    ':!scripts/rebrand.sh' \
    ':!scripts/upstream-merge.sh' \
    ':!tests/fixtures/rebrand/**' \
    ':!docs/sunclaw/**' \
    ':!docs/assets/*.svg' \
    ':!apps/**/LICENSE' \
    ':!.github/workflows/sunclaw-fork.yml' \
    | grep -vE '@openclaw/(fs-safe|proxyline)'; then
  echo "::error::Survivor scan found raw OpenClaw references after rebrand." >&2
  echo "Either extend scripts/rebrand.sh, or add legitimate exceptions to the" >&2
  echo "allowlists in .github/workflows/sunclaw-fork.yml AND in this script." >&2
  exit 2
fi
echo "Survivor scan clean."

# ---- Update the pin --------------------------------------------------------

echo ">>> Updating UPSTREAM.md pin..."
# Update either of the two accepted pin formats in place, idempotently.
sed -i.bak \
  -e "s/\(\*\*Fork SHA pinned at M0:\*\* \)[0-9a-f]\{40\}/\1${NEW_SHA}/" \
  -e "s/\(Upstream SHA: \)[0-9a-f]\{40\}/\1${NEW_SHA}/" \
  UPSTREAM.md
rm -f UPSTREAM.md.bak

if ! grep -q "$NEW_SHA" UPSTREAM.md; then
  echo "::error::Failed to update UPSTREAM.md pin -- format unrecognized." >&2
  echo "Expected one of: '**Fork SHA pinned at M0:** <sha>' or 'Upstream SHA: <sha>'." >&2
  exit 2
fi

# ---- Commit the rebrand + pin update --------------------------------------

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "chore(upstream): re-run rebrand + bump UPSTREAM.md pin

Synced from $UPSTREAM_REF.
Old pin: $OLD_PIN
New pin: $NEW_SHA

Co-Authored-By: SunClaw upstream-merge.sh <noreply@complex.az>"
else
  echo "(No rebrand churn after merge -- skipping post-merge commit.)"
fi

# ---- Done ------------------------------------------------------------------

echo
echo "============================================================"
echo "Upstream sync complete on branch: $SYNC_BRANCH"
echo "  Old pin: $OLD_PIN"
echo "  New pin: $NEW_SHA"
echo
echo "Next steps (review-gated, NOT done automatically):"
echo "  1. Review the merge:    git log --oneline main..$SYNC_BRANCH"
echo "  2. Inspect rebrand diff: git diff main..$SYNC_BRANCH -- scripts/rebrand.sh"
echo "  3. Push when ready:     git push -u origin $SYNC_BRANCH"
echo "  4. Open PR:             gh pr create --base main --title 'Upstream sync $(date +%Y-%m-%d)'"
echo "============================================================"
