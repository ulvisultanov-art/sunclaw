---
summary: "CLI reference for `sunclaw uninstall` (remove gateway service + local data)"
read_when:
  - You want to remove the gateway service and/or local state
  - You want a dry-run first
title: "Uninstall"
---

# `sunclaw uninstall`

Uninstall the gateway service + local data (CLI remains).

Options:

- `--service`: remove the gateway service
- `--state`: remove state and config
- `--workspace`: remove workspace directories
- `--app`: remove the macOS app
- `--all`: remove service, state, workspace, and app
- `--yes`: skip confirmation prompts
- `--non-interactive`: disable prompts; requires `--yes`
- `--dry-run`: print actions without removing files

Examples:

```bash
sunclaw backup create
sunclaw uninstall
sunclaw uninstall --service --yes --non-interactive
sunclaw uninstall --state --workspace --yes --non-interactive
sunclaw uninstall --all --yes
sunclaw uninstall --dry-run
```

Notes:

- Run `sunclaw backup create` first if you want a restorable snapshot before removing state or workspaces.
- `--state` preserves configured workspace directories unless `--workspace` is also selected.
- `--all` is shorthand for removing service, state, workspace, and app together.
- `--non-interactive` requires `--yes`.

## Related

- [CLI reference](/cli)
- [Uninstall](/install/uninstall)
