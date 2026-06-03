---
summary: "Uninstall SunClaw completely (CLI, service, state, workspace)"
read_when:
  - You want to remove SunClaw from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

Two paths:

- **Easy path** if `sunclaw` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
sunclaw uninstall
```

When using the CLI, state removal preserves configured workspace directories unless you also select `--workspace`.

Non-interactive (automation / npx):

```bash
sunclaw uninstall --all --yes --non-interactive
npx -y sunclaw uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
sunclaw gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
sunclaw gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${SUNCLAW_STATE_DIR:-$HOME/.sunclaw}"
```

If you set `SUNCLAW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.
If you want to keep a workspace inside the state dir, such as `~/.sunclaw/workspace`, move it aside before running `rm -rf` or delete state contents selectively.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.sunclaw/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g sunclaw
pnpm remove -g sunclaw
bun remove -g sunclaw
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/SunClaw.app
```

Notes:

- If you used profiles (`--profile` / `SUNCLAW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.sunclaw-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `sunclaw` is missing.

### macOS (launchd)

Default label is `ai.sunclaw.gateway` (or `ai.sunclaw.<profile>`; legacy `com.sunclaw.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.sunclaw.gateway
rm -f ~/Library/LaunchAgents/ai.sunclaw.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.sunclaw.<profile>`. Remove any legacy `com.sunclaw.*` plists if present.

### Linux (systemd user unit)

Default unit name is `sunclaw-gateway.service` (or `sunclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now sunclaw-gateway.service
rm -f ~/.config/systemd/user/sunclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `SunClaw Gateway` (or `SunClaw Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "SunClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.sunclaw\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.sunclaw-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://docs.sunclaw.complex.az/install.sh` or `install.ps1`, the CLI was installed with `npm install -g sunclaw@latest`.
Remove it with `npm rm -g sunclaw` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `sunclaw ...` / `bun run sunclaw ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

## Related

- [Install overview](/install)
- [Migration guide](/install/migrating)
