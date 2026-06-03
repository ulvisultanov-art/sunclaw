# @sunclaw/tokenjuice

Official Tokenjuice output compaction plugin for SunClaw.

Tokenjuice compacts noisy `exec` and `bash` tool results after commands run, before the result is fed back into the active agent session. It does not rewrite commands, rerun commands, or change exit codes.

## Install

```bash
sunclaw plugins install @sunclaw/tokenjuice
```

Restart the Gateway after installing or updating the plugin.

## Enable

```bash
sunclaw config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
sunclaw plugins enable tokenjuice
```

## Docs

- https://docs.sunclaw.complex.az/tools/tokenjuice

## Package

- Plugin id: `tokenjuice`
- Package: `@sunclaw/tokenjuice`
- Minimum SunClaw host: `2026.5.28`
