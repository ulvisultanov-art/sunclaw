# @sunclaw/acpx

Official ACP runtime backend for SunClaw.

ACPx lets SunClaw run external coding harnesses through the Agent Client Protocol while SunClaw still owns sessions, channels, delivery, permissions, and Gateway state.

## Install

```bash
sunclaw plugins install @sunclaw/acpx
```

Restart the Gateway after installing or updating the plugin.

## What it provides

- ACP-backed agent runtime sessions.
- Plugin-owned session and transport management.
- MCP bridge helpers for SunClaw tools and plugin tools.
- Static runtime assets used by the ACP process bridge.

## Configure

Use the ACP docs for harness-specific setup, permission modes, and model/runtime selection:

- https://docs.sunclaw.complex.az/tools/acp-agents-setup
- https://docs.sunclaw.complex.az/tools/acp-agents

## Package

- Plugin id: `acpx`
- Package: `@sunclaw/acpx`
- Minimum SunClaw host: `2026.4.25`
