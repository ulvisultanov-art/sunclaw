# @sunclaw/pixverse-provider

Official PixVerse video generation provider plugin for SunClaw.

This plugin registers PixVerse as a `video_generate` provider for text-to-video and image-to-video workflows.

## Install

```bash
sunclaw plugins install @sunclaw/pixverse-provider
```

Restart the Gateway after installing or updating the plugin.

## Configure

Store your PixVerse API key in SunClaw config or expose the supported environment variable to the Gateway. Then select PixVerse as a video generation provider.

Full setup and model/provider examples:

- https://docs.sunclaw.complex.az/providers/pixverse

## Package

- Plugin id: `pixverse`
- Package: `@sunclaw/pixverse-provider`
- Minimum SunClaw host: `2026.5.26`
