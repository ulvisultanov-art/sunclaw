# SunClaw Upstream Tracking

**Upstream:** github.com/openclaw/openclaw
**Fork:** github.com/ulvisultanov-art/sunclaw
**License:** MIT (see LICENSE)
**Fork SHA pinned at M0:** 2accf3875ba07254becc74f65eecaf5383e74e9d
**Fork date:** 2026-06-03
**Sync cadence:** Biweekly via `scripts/upstream-merge.sh`

## How to sync

```bash
git fetch upstream
./scripts/upstream-merge.sh upstream/main
```

This fetches upstream, merges into a fresh `upstream-sync-YYYYMMDD` branch,
re-runs the rebrand pipeline + fixture suite + survivor scan, and updates
the pinned SHA above. The script does **not** push or open a PR — review
the resulting branch locally first, then push and open the PR by hand.

If the merge hits conflicts, resolve them and commit, then resume with:

```bash
./scripts/upstream-merge.sh --skip-merge
```

which bypasses the dirty-tree gate + merge step and only re-runs the
post-merge gates (rebrand, fixtures, survivor scan, pin update).
