#!/usr/bin/env bash
set -euo pipefail

source scripts/lib/sunclaw-e2e-instance.sh
source scripts/lib/docker-e2e-logs.sh
SUNCLAW_PLUGINS_SWEEP_SOURCE_ONLY="${SUNCLAW_PLUGINS_SWEEP_SOURCE_ONLY:-0}"
if [[ -z "${SUNCLAW_ENTRY:-}" && "$SUNCLAW_PLUGINS_SWEEP_SOURCE_ONLY" != "1" ]]; then
  SUNCLAW_ENTRY="$(sunclaw_e2e_resolve_entrypoint)"
fi
export SUNCLAW_ENTRY
SUNCLAW_PLUGINS_CREATED_TMP_DIR=0
if [[ -z "${SUNCLAW_PLUGINS_TMP_DIR:-}" ]]; then
  SUNCLAW_PLUGINS_TMP_DIR="$(mktemp -d "/tmp/sunclaw-plugins.XXXXXX")"
  SUNCLAW_PLUGINS_CREATED_TMP_DIR=1
fi
export SUNCLAW_PLUGINS_TMP_DIR
SUNCLAW_PLUGINS_CLI_TIMEOUT="${SUNCLAW_PLUGINS_CLI_TIMEOUT:-180s}"
mkdir -p "$SUNCLAW_PLUGINS_TMP_DIR"

run_plugins_sunclaw_logged() {
  local label="$1"
  shift
  run_logged "$label" sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" "$@"
}

run_plugins_sunclaw_capture() {
  local output_file="$1"
  shift
  sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" "$@" >"$output_file"
}

run_plugins_shell_logged() {
  local label="$1"
  shift
  local command="$1"
  run_logged "$label" sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" bash -c "$command"
}

source scripts/e2e/lib/plugins/fixtures.sh
source scripts/e2e/lib/plugins/marketplace.sh
source scripts/e2e/lib/plugins/clawhub.sh

cleanup_sunclaw_plugins_sweep() {
  sunclaw_plugins_cleanup_fixture_servers
  if [[ "${SUNCLAW_PLUGINS_CREATED_TMP_DIR:-0}" = "1" ]]; then
    rm -rf "$SUNCLAW_PLUGINS_TMP_DIR"
  fi
}

if [[ "$SUNCLAW_PLUGINS_SWEEP_SOURCE_ONLY" = "1" ]]; then
  return 0 2>/dev/null || { cleanup_sunclaw_plugins_sweep; exit 0; }
fi

trap cleanup_sunclaw_plugins_sweep EXIT

sunclaw_e2e_eval_test_state_from_b64 "${SUNCLAW_TEST_STATE_SCRIPT_B64:?missing SUNCLAW_TEST_STATE_SCRIPT_B64}"
PACKAGE_VERSION="$(node -p 'require("./package.json").version')"
SUNCLAW_PACKAGE_ACCEPTANCE_LEGACY_COMPAT="$(node scripts/e2e/lib/package-compat.mjs "$PACKAGE_VERSION")"
export SUNCLAW_PACKAGE_ACCEPTANCE_LEGACY_COMPAT
BUNDLED_PLUGIN_ROOT_DIR="extensions"
SUNCLAW_PLUGIN_HOME="$HOME/.sunclaw/$BUNDLED_PLUGIN_ROOT_DIR"

demo_plugin_id="demo-plugin"
demo_plugin_root="$SUNCLAW_PLUGIN_HOME/$demo_plugin_id"
write_demo_fixture_plugin "$demo_plugin_root"
record_fixture_plugin_trust "$demo_plugin_id" "$demo_plugin_root" 1

run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-inspect.json" plugins inspect demo-plugin --runtime --json

node scripts/e2e/lib/plugins/assertions.mjs demo-plugin

echo "Testing tgz install flow..."
pack_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-pack.XXXXXX")"
pack_fixture_plugin "$pack_dir" "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-tgz.tgz" demo-plugin-tgz 0.0.1 demo.tgz "Demo Plugin TGZ"

run_plugins_sunclaw_logged install-tgz plugins install "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-tgz.tgz"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins2.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins2-inspect.json" plugins inspect demo-plugin-tgz --runtime --json

node scripts/e2e/lib/plugins/assertions.mjs plugin-tgz

run_plugins_sunclaw_logged uninstall-tgz plugins uninstall demo-plugin-tgz --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins2-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-tgz-removed

echo "Testing install from local folder (plugins.load.paths)..."
dir_plugin="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-dir.XXXXXX")"
write_fixture_plugin "$dir_plugin" demo-plugin-dir 0.0.1 demo.dir "Demo Plugin DIR"

run_plugins_sunclaw_logged install-dir plugins install "$dir_plugin"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins3.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins3-inspect.json" plugins inspect demo-plugin-dir --runtime --json

node scripts/e2e/lib/plugins/assertions.mjs plugin-dir "$dir_plugin"

sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" plugins update demo-plugin-dir >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-dir-update.log" 2>&1
node scripts/e2e/lib/plugins/assertions.mjs plugin-dir-update-skipped

run_plugins_sunclaw_logged uninstall-dir plugins uninstall demo-plugin-dir --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins3-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-dir-removed

echo "Testing install from local folder with preinstalled dependencies..."
dir_deps_plugin="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-dir-deps.XXXXXX")"
write_fixture_plugin_with_vendored_dependency "$dir_deps_plugin" demo-plugin-dir-deps 0.0.1 demo.dir.deps "Demo Plugin DIR Deps"

run_plugins_sunclaw_logged install-dir-deps plugins install "$dir_deps_plugin"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-dir-deps.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-dir-deps-inspect.json" plugins inspect demo-plugin-dir-deps --runtime --json

node scripts/e2e/lib/plugins/assertions.mjs plugin-dir-deps "$dir_deps_plugin"

run_plugins_sunclaw_logged uninstall-dir-deps plugins uninstall demo-plugin-dir-deps --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-dir-deps-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-dir-deps-removed

echo "Testing install from npm spec (file:)..."
file_pack_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-filepack.XXXXXX")"
write_fixture_plugin "$file_pack_dir/package" demo-plugin-file 0.0.1 demo.file "Demo Plugin FILE"

run_plugins_sunclaw_logged install-file plugins install "file:$file_pack_dir/package"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins4.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins4-inspect.json" plugins inspect demo-plugin-file --runtime --json

node scripts/e2e/lib/plugins/assertions.mjs plugin-file "$file_pack_dir/package"

run_plugins_sunclaw_logged uninstall-file plugins uninstall demo-plugin-file --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins4-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-file-removed

echo "Testing install and update from npm registry..."
npm_pack_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-npm-pack.XXXXXX")"
npm_dep_pack_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-npm-dep-pack.XXXXXX")"
invalid_npm_pack_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-invalid-metadata-pack.XXXXXX")"
npm_registry_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-npm-registry.XXXXXX")"
pack_fixture_plugin_with_cli_registry_dependency "$npm_pack_dir" "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-npm.tgz" demo-plugin-npm 0.0.1 demo.npm "Demo Plugin NPM" demo-npm "demo-plugin-npm:pong"
pack_fake_is_number_package "$npm_dep_pack_dir" "$SUNCLAW_PLUGINS_TMP_DIR/is-number-7.0.0.tgz"
pack_fixture_plugin_with_invalid_extension_entry "$invalid_npm_pack_dir" "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-invalid-metadata.tgz" demo-plugin-invalid-metadata 0.0.1 demo.invalid.metadata "Demo Plugin Invalid Metadata"
start_npm_fixture_registry "@sunclaw/demo-plugin-npm" "0.0.1" "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-npm.tgz" "$npm_registry_dir" "is-number" "7.0.0" "$SUNCLAW_PLUGINS_TMP_DIR/is-number-7.0.0.tgz" "@sunclaw/demo-plugin-invalid-metadata" "0.0.1" "$SUNCLAW_PLUGINS_TMP_DIR/demo-plugin-invalid-metadata.tgz"

run_plugins_sunclaw_logged install-npm plugins install "npm:@sunclaw/demo-plugin-npm@0.0.1"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-npm.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-npm-inspect.json" plugins inspect demo-plugin-npm --runtime --json
run_plugins_shell_logged exec-npm-plugin-cli 'node "$SUNCLAW_ENTRY" demo-npm ping >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-npm-cli.txt"'

node scripts/e2e/lib/plugins/assertions.mjs plugin-npm

sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" plugins update demo-plugin-npm >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-npm-update.log" 2>&1
node scripts/e2e/lib/plugins/assertions.mjs plugin-npm-update

run_plugins_sunclaw_logged uninstall-npm plugins uninstall demo-plugin-npm --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-npm-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-npm-removed

echo "Testing npm install rejects malformed package metadata..."
if sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" plugins install "npm:@sunclaw/demo-plugin-invalid-metadata@0.0.1" >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-invalid-sunclaw-extensions.log" 2>&1; then
  cat "$SUNCLAW_PLUGINS_TMP_DIR/plugins-invalid-sunclaw-extensions.log"
  echo "Expected malformed package metadata install to fail." >&2
  exit 1
fi
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-invalid-sunclaw-extensions-list.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs invalid-sunclaw-extensions

echo "Testing install from git repo and plugin CLI execution..."
git_fixture_root="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-git.XXXXXX")"
git_repo="$git_fixture_root/repo"
git_repo_url="file://$git_repo"
write_fixture_plugin_with_cli "$git_repo" demo-plugin-git 0.0.1 demo.git "Demo Plugin Git" demo-git "demo-plugin-git:pong"
git -C "$git_repo" init -q
git -C "$git_repo" config user.email "docker-e2e@sunclaw.local"
git -C "$git_repo" config user.name "SunClaw Docker E2E"
git -C "$git_repo" add -A
git -C "$git_repo" commit -qm "test fixture"
git_ref="$(git -C "$git_repo" rev-parse HEAD)"

run_plugins_sunclaw_logged install-git plugins install "git:$git_repo_url@$git_ref"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-git.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-inspect.json" plugins inspect demo-plugin-git --runtime --json
run_plugins_shell_logged exec-git-plugin-cli 'node "$SUNCLAW_ENTRY" demo-git ping >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-cli.txt"'

node scripts/e2e/lib/plugins/assertions.mjs plugin-git "$git_repo_url" "$git_ref"

run_plugins_sunclaw_logged uninstall-git plugins uninstall demo-plugin-git --force
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-uninstalled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs plugin-git-removed

echo "Testing git plugin update from moving ref..."
git_update_fixture_root="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-git-update.XXXXXX")"
git_update_repo="$git_update_fixture_root/repo"
git_update_repo_url="file://$git_update_repo"
write_fixture_plugin_with_cli "$git_update_repo" demo-plugin-git-update 0.0.1 demo.git.update.v1 "Demo Plugin Git Update" demo-git-update "demo-plugin-git-update:pong-v1"
git -C "$git_update_repo" init -q
git -C "$git_update_repo" config user.email "docker-e2e@sunclaw.local"
git -C "$git_update_repo" config user.name "SunClaw Docker E2E"
git -C "$git_update_repo" checkout -qb main
git -C "$git_update_repo" add -A
git -C "$git_update_repo" commit -qm "test fixture v1"
git_update_ref_v1="$(git -C "$git_update_repo" rev-parse HEAD)"

run_plugins_sunclaw_logged install-git-update plugins install "git:$git_update_repo_url@main"
write_fixture_plugin_with_cli "$git_update_repo" demo-plugin-git-update 0.0.2 demo.git.update.v2 "Demo Plugin Git Update" demo-git-update "demo-plugin-git-update:pong-v2"
git -C "$git_update_repo" add -A
git -C "$git_update_repo" commit -qm "test fixture v2"

sunclaw_e2e_maybe_timeout "$SUNCLAW_PLUGINS_CLI_TIMEOUT" node "$SUNCLAW_ENTRY" plugins update demo-plugin-git-update >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-update.log" 2>&1
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-update.json" plugins list --json
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-update-inspect.json" plugins inspect demo-plugin-git-update --runtime --json
run_plugins_shell_logged exec-updated-git-plugin-cli 'node "$SUNCLAW_ENTRY" demo-git-update ping >"$SUNCLAW_PLUGINS_TMP_DIR/plugins-git-update-cli.txt"'

node scripts/e2e/lib/plugins/assertions.mjs plugin-git-updated "$git_update_ref_v1"

echo "Testing Claude bundle enable and inspect flow..."
bundle_plugin_id="claude-bundle-e2e"
bundle_root="$SUNCLAW_PLUGIN_HOME/$bundle_plugin_id"
write_claude_bundle_fixture "$bundle_root"
record_fixture_plugin_trust "$bundle_plugin_id" "$bundle_root" 0

run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-bundle-disabled.json" plugins list --json
node scripts/e2e/lib/plugins/assertions.mjs bundle-disabled

run_plugins_sunclaw_logged enable-claude-bundle plugins enable claude-bundle-e2e
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugins-bundle-inspect.json" plugins inspect claude-bundle-e2e --json
node scripts/e2e/lib/plugins/assertions.mjs bundle-inspect

echo "Testing plugin install visible after explicit restart..."
slash_install_dir="$(mktemp -d "$SUNCLAW_PLUGINS_TMP_DIR/sunclaw-plugin-slash-install.XXXXXX")"
write_fixture_plugin "$slash_install_dir" slash-install-plugin 0.0.1 demo.slash.install "Slash Install Plugin"

run_plugins_sunclaw_logged install-slash-plugin plugins install "$slash_install_dir"
run_plugins_sunclaw_capture "$SUNCLAW_PLUGINS_TMP_DIR/plugin-command-install-show.json" plugins inspect slash-install-plugin --runtime --json
node scripts/e2e/lib/plugins/assertions.mjs slash-install

run_plugins_marketplace_scenario

run_plugins_clawhub_scenario
