---
name: verify-release
description: "Verify an SunClaw release is fully published across GitHub, npm, plugins, ClawHub, package smoke, and live Gateway agent turns."
---

# Verify Release

Use this when asked whether an SunClaw release is fully released, published,
promoted, smoke-tested, or live-verified. This is a verification skill, not a
publish skill; use `$release-sunclaw-maintainer` before changing release state.

## Rules

- Resolve short suffixes like `.27` to the concrete CalVer version from the
  current date/context, then say the resolved version.
- Verify live state. Do not trust local checkout state, release notes, or old
  memory as current truth.
- If the checkout is dirty or divergent, use it only for scripts/reference.
  For version metadata, fetch from GitHub release/tag or unpack the tag tarball
  under `/tmp`.
- Never print secrets. Use inherited live keys only for scoped smoke commands.
- Keep the final terse: `yes/no`, evidence bullets, caveats, cleanup.

## Core Checks

1. GitHub release:
   - `gh release view v<VERSION> --repo sunclaw/sunclaw --json tagName,name,publishedAt,isDraft,isPrerelease,targetCommitish,url,body,assets`
   - Confirm stable releases are not draft/prerelease.
   - Confirm release body has npm, CI, plugin npm, ClawHub, mac/appcast evidence
     links when expected.
   - Confirm assets expected for stable mac releases are uploaded: zip, dmg,
     dSYM, dependency evidence when present.
2. Root npm:
   - `npm view sunclaw@<VERSION> version dist-tags.latest dist.tarball dist.integrity time.<VERSION> --json`
   - `latest` must equal `<VERSION>` for stable.
   - Record tarball, integrity, publish time.
3. Plugin publish set:
   - Get exact tag metadata from GitHub, not the local checkout when dirty:
     download `https://api.github.com/repos/sunclaw/sunclaw/tarball/v<VERSION>`
     into `/tmp/sunclaw-v<VERSION>-src`.
   - Count `extensions/*/package.json` with
     `sunclaw.release.publishToNpm === true` and
     `sunclaw.release.publishToClawHub === true`.
   - Compare expected counts to workflow job counts:
     `gh api repos/sunclaw/sunclaw/actions/runs/<RUN>/jobs --paginate`.
   - Each expected npm plugin must have version `<VERSION>` and
     `dist-tags.latest === <VERSION>`.
4. ClawHub:
   - Check the Plugin ClawHub Release workflow conclusion and publish job count.
   - Use SunClaw itself for live registry proof:
     `sunclaw plugins search <known-plugin> --json`.
   - Install one official plugin from ClawHub in an isolated HOME:
     `sunclaw plugins install clawhub:@sunclaw/matrix --pin`.
     Prefer `matrix` unless that plugin is not in the expected set.
5. Release workflows:
   - Verify conclusions for release notes evidence links:
     Full Release Validation, SunClaw Release Checks, SunClaw NPM Release,
     Plugin NPM Release, Plugin ClawHub Release, mac preflight/validation/publish
     when stable mac assets are expected.
   - Summarize only relevant successful/failed jobs; ignore routine skipped
     optional lanes unless the release body promised them.
6. Published package smoke:
   - In `/tmp`, isolated HOME:
     `npm exec --yes --package sunclaw@<VERSION> -- sunclaw --version`.
   - Run at least one harmless command that touches the published CLI surface,
     for example `plugins --help` or `gateway --help`.
7. Dev Gateway live model smoke:
   - Use temp HOME/workspace, not the user's normal state:
     `HOME=/tmp/sunclaw-release-smoke/home SUNCLAW_WORKSPACE=/tmp/sunclaw-release-smoke/work pnpm sunclaw --dev gateway run --auth none --force --verbose`.
   - Health check via CLI: `sunclaw --dev gateway health --json`.
   - Run one Gateway-backed agent turn with inherited `OPENAI_API_KEY`, short
     prompt, explicit session key, JSON output, and a known-available model.
   - If the configured default model fails as unavailable, record that caveat
     and retry with the newest known-good OpenAI model instead of declaring the
     release failed.
   - Stop the gateway and verify the port is not listening.

## Caveats To Report

- Dist-tag caveat: stable `latest` is release truth; if optional `beta` mirrors
  still point at a beta version, report it as a caveat, not a stable-release
  blocker, unless the user asked to verify beta promotion.
- Divergent checkout caveat: say when local source SHA differs from release tag
  or origin and which live sources were used instead.
- Smoke caveat: distinguish Gateway-backed agent success from local embedded
  fallback. A valid Gateway smoke has health OK plus gateway log/run id for the
  agent call.
