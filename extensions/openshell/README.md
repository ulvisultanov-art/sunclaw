# @sunclaw/openshell-sandbox

Official NVIDIA OpenShell sandbox backend for SunClaw.

This plugin lets SunClaw use OpenShell-managed sandboxes with mirrored local workspaces and SSH command execution.

## Install

```bash
sunclaw plugins install @sunclaw/openshell-sandbox
```

Restart the Gateway after installing or updating the plugin.

## Configure

Use the OpenShell docs for credentials, workspace mirroring, runtime selection, and troubleshooting:

- https://docs.sunclaw.complex.az/gateway/openshell

## Package

- Plugin id: `openshell`
- Package: `@sunclaw/openshell-sandbox`
- Minimum SunClaw host: `2026.5.12-beta.1`
