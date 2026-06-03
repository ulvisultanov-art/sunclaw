---
summary: "CLI reference for `sunclaw browser` (lifecycle, profiles, tabs, actions, state, and debugging)"
read_when:
  - You use `sunclaw browser` and want examples for common tasks
  - You want to control a browser running on another machine via a node host
  - You want to attach to your local signed-in Chrome via Chrome MCP
title: "Browser"
---

# `sunclaw browser`

Manage SunClaw's browser control surface and run browser actions (lifecycle, profiles, tabs, snapshots, screenshots, navigation, input, state emulation, and debugging).

Related:

- Browser tool + API: [Browser tool](/tools/browser)

## Common flags

- `--url <gatewayWsUrl>`: Gateway WebSocket URL (defaults to config).
- `--token <token>`: Gateway token (if required).
- `--timeout <ms>`: request timeout (ms).
- `--expect-final`: wait for a final Gateway response.
- `--browser-profile <name>`: choose a browser profile (default from config).
- `--json`: machine-readable output (where supported).

## Quick start (local)

```bash
sunclaw browser profiles
sunclaw browser --browser-profile sunclaw start
sunclaw browser --browser-profile sunclaw open https://example.com
sunclaw browser --browser-profile sunclaw snapshot
```

Agents can run the same readiness check with `browser({ action: "doctor" })`.

## Quick troubleshooting

If `start` fails with `not reachable after start`, troubleshoot CDP readiness first. If `start` and `tabs` succeed but `open` or `navigate` fails, the browser control plane is healthy and the failure is usually navigation SSRF policy.

Minimal sequence:

```bash
sunclaw browser --browser-profile sunclaw doctor
sunclaw browser --browser-profile sunclaw start
sunclaw browser --browser-profile sunclaw tabs
sunclaw browser --browser-profile sunclaw open https://example.com
```

Detailed guidance: [Browser troubleshooting](/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Lifecycle

```bash
sunclaw browser status
sunclaw browser doctor
sunclaw browser doctor --deep
sunclaw browser start
sunclaw browser start --headless
sunclaw browser stop
sunclaw browser --browser-profile sunclaw reset-profile
```

Notes:

- `doctor --deep` adds a live snapshot probe. It is useful when basic CDP
  readiness is green but you want proof that the current tab can be inspected.
- For `attachOnly` and remote CDP profiles, `sunclaw browser stop` closes the
  active control session and clears temporary emulation overrides even when
  SunClaw did not launch the browser process itself.
- For local managed profiles, `sunclaw browser stop` stops the spawned browser
  process.
- `sunclaw browser start --headless` applies only to that start request and
  only when SunClaw launches a local managed browser. It does not rewrite
  `browser.headless` or profile config, and it is a no-op for an already-running
  browser.
- On Linux hosts without `DISPLAY` or `WAYLAND_DISPLAY`, local managed profiles
  run headless automatically unless `SUNCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false`, or `browser.profiles.<name>.headless=false`
  explicitly requests a visible browser.

## If the command is missing

If `sunclaw browser` is an unknown command, check `plugins.allow` in
`~/.sunclaw/sunclaw.json`.

When `plugins.allow` is present, list the bundled browser plugin explicitly
unless the config already has a root `browser` block:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

An explicit root `browser` block, for example `browser.enabled=true` or
`browser.profiles.<name>`, also activates the bundled browser plugin under a
restrictive plugin allowlist.

Related: [Browser tool](/tools/browser#missing-browser-command-or-tool)

## Profiles

Profiles are named browser routing configs. In practice:

- `sunclaw`: launches or attaches to a dedicated SunClaw-managed Chrome instance (isolated user data dir).
- `user`: controls your existing signed-in Chrome session via Chrome DevTools MCP.
- custom CDP profiles: point at a local or remote CDP endpoint.

```bash
sunclaw browser profiles
sunclaw browser create-profile --name work --color "#FF5A36"
sunclaw browser create-profile --name chrome-live --driver existing-session
sunclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
sunclaw browser delete-profile --name work
```

Use a specific profile:

```bash
sunclaw browser --browser-profile work tabs
```

## Tabs

```bash
sunclaw browser tabs
sunclaw browser tab new --label docs
sunclaw browser tab label t1 docs
sunclaw browser tab select 2
sunclaw browser tab close 2
sunclaw browser open https://docs.sunclaw.complex.az --label docs
sunclaw browser focus docs
sunclaw browser close t1
```

`tabs` returns `suggestedTargetId` first, then the stable `tabId` such as `t1`,
the optional label, and the raw `targetId`. Agents should pass
`suggestedTargetId` back into `focus`, `close`, snapshots, and actions. You can
assign a label with `open --label`, `tab new --label`, or `tab label`; labels,
tab ids, raw target ids, and unique target-id prefixes are all accepted.
The request field is still named `targetId` for compatibility, but it accepts
these tab references. Treat raw target ids as diagnostic handles, not durable
agent memory.
When Chromium replaces the underlying raw target during a navigation or form
submit, SunClaw keeps the stable `tabId`/label attached to the replacement tab
when it can prove the match. Raw target ids remain volatile; prefer
`suggestedTargetId`.

## Snapshot / screenshot / actions

Snapshot:

```bash
sunclaw browser snapshot
sunclaw browser snapshot --urls
```

Screenshot:

```bash
sunclaw browser screenshot
sunclaw browser screenshot --full-page
sunclaw browser screenshot --ref e12
sunclaw browser screenshot --labels
```

Notes:

- `--full-page` is for page captures only; it cannot be combined with `--ref`
  or `--element`.
- `existing-session` / `user` profiles support page screenshots and `--ref`
  screenshots from snapshot output, but not CSS `--element` screenshots.
- `--labels` overlays current snapshot refs on the screenshot.
- `snapshot --urls` appends discovered link destinations to AI snapshots so
  agents can choose direct navigation targets instead of guessing from link
  text alone.

Navigate/click/type (ref-based UI automation):

```bash
sunclaw browser navigate https://example.com
sunclaw browser click <ref>
sunclaw browser click-coords 120 340
sunclaw browser type <ref> "hello"
sunclaw browser press Enter
sunclaw browser hover <ref>
sunclaw browser scrollintoview <ref>
sunclaw browser drag <startRef> <endRef>
sunclaw browser select <ref> OptionA OptionB
sunclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
sunclaw browser wait --text "Done"
sunclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
sunclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

Use `evaluate --timeout-ms <ms>` when the page-side function may need longer
than the default evaluate timeout.

Action responses return the current raw `targetId` after action-triggered page
replacement when SunClaw can prove the replacement tab. Scripts should still
store and pass `suggestedTargetId`/labels for long-lived workflows.

File + dialog helpers:

```bash
sunclaw browser upload /tmp/sunclaw/uploads/file.pdf --ref <ref>
sunclaw browser upload media://inbound/file.pdf --ref <ref>
sunclaw browser waitfordownload
sunclaw browser download <ref> report.pdf
sunclaw browser dialog --accept
sunclaw browser dialog --dismiss --dialog-id d1
```

Managed Chrome profiles save ordinary click-triggered downloads into the SunClaw
downloads directory (`/tmp/sunclaw/downloads` by default, or the configured temp
root). Use `waitfordownload` or `download` when the agent needs to wait for a
specific file and return its path; those explicit waiters own the next download.
Uploads accept files from the SunClaw temp uploads root and SunClaw-managed
inbound media, including `media://inbound/<id>` and sandbox-relative
`media/inbound/<id>` references. Nested media refs, traversal, and arbitrary
local paths remain rejected.
When an action opens a modal dialog, the action response returns
`blockedByDialog` with `browserState.dialogs.pending`; pass `--dialog-id` to
answer it directly. Dialogs handled outside SunClaw appear under
`browserState.dialogs.recent`.

## State and storage

Viewport + emulation:

```bash
sunclaw browser resize 1280 720
sunclaw browser set viewport 1280 720
sunclaw browser set offline on
sunclaw browser set media dark
sunclaw browser set timezone Europe/London
sunclaw browser set locale en-GB
sunclaw browser set geo 51.5074 -0.1278 --accuracy 25
sunclaw browser set device "iPhone 14"
sunclaw browser set headers '{"x-test":"1"}'
sunclaw browser set credentials myuser mypass
```

Cookies + storage:

```bash
sunclaw browser cookies
sunclaw browser cookies set session abc123 --url https://example.com
sunclaw browser cookies clear
sunclaw browser storage local get
sunclaw browser storage local set token abc123
sunclaw browser storage session clear
```

## Debugging

```bash
sunclaw browser console --level error
sunclaw browser pdf
sunclaw browser responsebody "**/api"
sunclaw browser highlight <ref>
sunclaw browser errors --clear
sunclaw browser requests --filter api
sunclaw browser trace start
sunclaw browser trace stop --out trace.zip
```

## Existing Chrome via MCP

Use the built-in `user` profile, or create your own `existing-session` profile:

```bash
sunclaw browser --browser-profile user tabs
sunclaw browser create-profile --name chrome-live --driver existing-session
sunclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
sunclaw browser --browser-profile chrome-live tabs
```

This path is host-only. For Docker, headless servers, Browserless, or other remote setups, use a CDP profile instead.

Current existing-session limits:

- snapshot-driven actions use refs, not CSS selectors
- `browser.actionTimeoutMs` defaults supported `act` requests to 60000 ms when
  callers omit `timeoutMs`; per-call `timeoutMs` still wins.
- `click` is left-click only
- `type` does not support `slowly=true`
- `press` does not support `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill`, and `evaluate` reject
  per-call timeout overrides
- `select` supports one value only
- `wait --load networkidle` is not supported
- file uploads require `--ref` / `--input-ref`, do not support CSS
  `--element`, and currently support one file at a time
- dialog hooks do not support `--timeout`
- screenshots support page captures and `--ref`, but not CSS `--element`
- `responsebody`, download interception, PDF export, and batch actions still
  require a managed browser or raw CDP profile

## Remote browser control (node host proxy)

If the Gateway runs on a different machine than the browser, run a **node host** on the machine that has Chrome/Brave/Edge/Chromium. The Gateway will proxy browser actions to that node (no separate browser control server required).

Use `gateway.nodes.browser.mode` to control auto-routing and `gateway.nodes.browser.node` to pin a specific node if multiple are connected.

Security + remote setup: [Browser tool](/tools/browser), [Remote access](/gateway/remote), [Tailscale](/gateway/tailscale), [Security](/gateway/security)

## Related

- [CLI reference](/cli)
- [Browser](/tools/browser)
