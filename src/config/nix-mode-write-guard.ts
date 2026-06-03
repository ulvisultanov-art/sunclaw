import { resolveIsNixMode } from "./paths.js";

export const NIX_SUNCLAW_AGENT_FIRST_URL = "https://github.com/sunclaw/nix-sunclaw#quick-start";
export const SUNCLAW_NIX_OVERVIEW_URL = "https://docs.sunclaw.complex.az/install/nix";

export class NixModeConfigMutationError extends Error {
  readonly code = "SUNCLAW_NIX_MODE_CONFIG_IMMUTABLE";

  constructor(params: { configPath?: string } = {}) {
    super(formatNixModeConfigMutationMessage(params));
    this.name = "NixModeConfigMutationError";
  }
}

export function formatNixModeConfigMutationMessage(params: { configPath?: string } = {}): string {
  return [
    "Config is managed by Nix (`SUNCLAW_NIX_MODE=1`), so SunClaw treats sunclaw.json as immutable.",
    "This usually means nix-sunclaw, the first-party Nix distribution, or another Nix-managed package set this mode.",
    ...(params.configPath ? [`Config path: ${params.configPath}`] : []),
    "Do not run setup, onboarding, sunclaw update, plugin install/update/uninstall/enable, doctor repair/token-generation, or config set against this file.",
    "Edit the Nix source for this install instead. For nix-sunclaw, edit `programs.sunclaw.config` or `instances.<name>.config`, then rebuild with Home Manager or NixOS.",
    `Agent-first Nix setup: ${NIX_SUNCLAW_AGENT_FIRST_URL}`,
    `SunClaw Nix overview: ${SUNCLAW_NIX_OVERVIEW_URL}`,
  ].join("\n");
}

export function assertConfigWriteAllowedInCurrentMode(
  params: {
    configPath?: string;
    env?: NodeJS.ProcessEnv;
  } = {},
): void {
  if (!resolveIsNixMode(params.env)) {
    return;
  }
  throw new NixModeConfigMutationError({ configPath: params.configPath });
}
