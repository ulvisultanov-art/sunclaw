# SunClaw Upstream Tracking

**Upstream:** github.com/ulvisultanov-art/sunclaw
**License:** MIT (see LICENSE)
**Fork SHA pinned at M0:** 2accf3875ba07254becc74f65eecaf5383e74e9d
**Fork date:** 2026-06-03
**Sync cadence:** Biweekly via `scripts/upstream-merge.sh`

## How to sync

```bash
git fetch upstream
./scripts/upstream-merge.sh upstream/main
```

This runs the rebrand script on incoming changes, then opens a PR for review.
