---
summary: "Plain-English and technical explanation of npm shrinkwrap in SunClaw releases"
read_when:
  - You want to know what npm shrinkwrap means in an SunClaw release
  - You are reviewing package lockfiles, dependency changes, or supply-chain risk
  - You are validating root or plugin npm packages before publishing
title: "npm shrinkwrap"
---

SunClaw source checkouts use `pnpm-lock.yaml`. Published SunClaw npm
packages use `npm-shrinkwrap.json`, npm's publishable dependency lockfile, so
package installs use the dependency graph reviewed during release.

## The easy version

Shrinkwrap is a receipt for the dependency tree that ships with an npm package.
It tells npm which exact transitive package versions to install.

For SunClaw releases, that means:

- the published package does not ask npm to invent a fresh dependency graph at
  install time;
- dependency changes become easier to review because they appear in a lockfile;
- release validation can test the same graph users will install;
- package-size or native-dependency surprises are easier to spot before
  publishing.

Shrinkwrap is not a sandbox. It does not make a dependency safe by itself, and
it does not replace host isolation, `sunclaw security audit`, package
provenance, or install smoke tests.

The short mental model:

| File                  | Where it matters        | What it means                    |
| --------------------- | ----------------------- | -------------------------------- |
| `pnpm-lock.yaml`      | SunClaw source checkout | Maintainer dependency graph      |
| `npm-shrinkwrap.json` | Published npm package   | npm install graph for users      |
| `package-lock.json`   | Local npm apps          | Not the SunClaw publish contract |

## Why SunClaw uses it

SunClaw is a gateway, plugin host, model router, and agent runtime. A default
install can affect startup time, disk use, native package downloads, and
supply-chain exposure.

Shrinkwrap gives release review a stable boundary:

- reviewers can see transitive dependency movement;
- package validators can reject unexpected lockfile drift;
- package acceptance can test installs with the graph that will ship;
- plugin packages can carry their own locked dependency graph instead of
  relying on the root package to own plugin-only dependencies.

The goal is not "more lockfiles." The goal is reproducible release installs
with clear ownership.

## Technical details

The root `sunclaw` npm package and SunClaw-owned npm plugin packages include
`npm-shrinkwrap.json` when they publish. Suitable SunClaw-owned plugin
packages can also publish with explicit `bundledDependencies`, so their runtime
dependency files are carried in the plugin tarball instead of depending only on
install-time resolution.

Maintain the boundary like this:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

The generator resolves npm's publishable lock format but rejects generated
package versions that are not already present in `pnpm-lock.yaml`. That keeps
the pnpm dependency age, override, and patch-review boundary intact.

Use root-only commands only when intentionally refreshing the root package
without touching plugin packages:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Review these files as security-sensitive:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- bundled plugin dependency payloads
- any `package-lock.json` diff

SunClaw package validators require shrinkwrap in new root package tarballs.
The plugin npm publish path checks plugin-local shrinkwrap, installs
package-local bundled dependencies, and then packs or publishes. Package
validators reject `package-lock.json` for published SunClaw packages.

To inspect a published root package:

```bash
npm pack sunclaw@<version> --json --pack-destination /tmp/sunclaw-pack
tar -tf /tmp/sunclaw-pack/sunclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

To inspect an SunClaw-owned plugin package:

```bash
npm pack @sunclaw/discord@<version> --json --pack-destination /tmp/sunclaw-plugin-pack
tar -tf /tmp/sunclaw-plugin-pack/sunclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/sunclaw-plugin-pack/sunclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Background: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
