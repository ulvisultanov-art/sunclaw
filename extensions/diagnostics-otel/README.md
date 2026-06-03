# @sunclaw/diagnostics-otel

Official OpenTelemetry diagnostics exporter for SunClaw.

This plugin exports SunClaw Gateway traces, metrics, and logs to an OTLP collector for observability stacks such as Grafana, Datadog, Honeycomb, New Relic, Tempo, and compatible collectors.

## Install

```bash
sunclaw plugins install @sunclaw/diagnostics-otel
```

Restart the Gateway after installing or updating the plugin.

## Configure

Enable the plugin and set the OTLP endpoint in `plugins.entries.diagnostics-otel.config`.

The full config surface, metric names, span names, and collector examples live in the docs:

- https://docs.sunclaw.complex.az/gateway/opentelemetry

## Package

- Plugin id: `diagnostics-otel`
- Package: `@sunclaw/diagnostics-otel`
- Minimum SunClaw host: `2026.4.25`
