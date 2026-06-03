# @sunclaw/diagnostics-prometheus

Official Prometheus diagnostics exporter for SunClaw.

This plugin exposes SunClaw Gateway runtime metrics in Prometheus text format for Prometheus, Grafana, VictoriaMetrics, and compatible scrapers.

## Install

```bash
sunclaw plugins install @sunclaw/diagnostics-prometheus
```

Restart the Gateway after installing or updating the plugin.

## Configure

Enable the plugin and set the scrape endpoint options in `plugins.entries.diagnostics-prometheus.config`.

The full config surface, metric names, and scrape examples live in the docs:

- https://docs.sunclaw.complex.az/gateway/prometheus

## Package

- Plugin id: `diagnostics-prometheus`
- Package: `@sunclaw/diagnostics-prometheus`
- Minimum SunClaw host: `2026.4.25`
