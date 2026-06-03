---
summary: "Test packaged plugin overrides with setup-time install flows"
read_when:
  - Testing onboarding or setup flows against a locally packed plugin
  - Verifying a plugin package before publishing it
  - Replacing an automatic plugin install with a test artifact
title: "Plugin install overrides"
sidebarTitle: "Install overrides"
---

Plugin install overrides let maintainers test setup-time plugin installs against
a specific npm package or local npm-pack tarball. They are for E2E and package
validation only. Normal users should install plugins with
[`sunclaw plugins install`](/cli/plugins).

<Warning>
Overrides execute plugin code from the source you provide. Use them only in an
isolated state directory or disposable test machine.
</Warning>

## Environment

Overrides are disabled unless both variables are set:

```bash
export SUNCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export SUNCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/sunclaw-codex-2026.5.8.tgz",
  "sunclaw-web-search": "npm:@sunclaw/web-search@2026.5.8"
}'
```

The override map is JSON keyed by plugin id. Values support:

- `npm:<registry-spec>` for registry packages and exact versions or tags
- `npm-pack:<path.tgz>` for local tarballs produced by `npm pack`

Relative `npm-pack:` paths resolve from the current working directory.

## Behavior

When a setup-time flow asks to install a plugin whose id appears in the map,
SunClaw uses the override source instead of the catalog, bundled, or default
npm source. This applies to onboarding and other flows that use the shared
setup-time plugin installer.

Overrides still enforce the expected plugin id. A tarball mapped to `codex`
must install a plugin whose manifest id is `codex`.

Overrides do not inherit official trusted-source status. Even when the catalog
entry normally represents an SunClaw-owned package, an override is treated as
operator-supplied test input.

Workspace `.env` files cannot enable install overrides. Set these variables in
the trusted shell, CI job, or remote test command that launches SunClaw.

## Package E2E

Use an isolated state directory so package installs and install records do not
touch your normal SunClaw state:

```bash
npm pack extensions/codex --pack-destination /tmp

SUNCLAW_STATE_DIR="$(mktemp -d)" \
SUNCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
SUNCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/sunclaw-codex-2026.5.8.tgz"}' \
pnpm sunclaw onboard --mode local
```

Verify the installed package under the state directory:

```bash
find "$SUNCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@sunclaw/codex/package.json' -print
grep -R '"@sunclaw/codex"' "$SUNCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

For live provider E2E, source the real API key from a trusted shell or CI secret
before launching the test command. Do not print keys; report only the source and
whether the key was present.
