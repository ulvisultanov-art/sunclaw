import {
  applyAgentDefaultModelPrimary,
  type SunClawConfig,
} from "sunclaw/plugin-sdk/provider-onboard";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.6";

export function applyOpencodeGoProviderConfig(cfg: SunClawConfig): SunClawConfig {
  return cfg;
}

export function applyOpencodeGoConfig(cfg: SunClawConfig): SunClawConfig {
  return applyAgentDefaultModelPrimary(
    applyOpencodeGoProviderConfig(cfg),
    OPENCODE_GO_DEFAULT_MODEL_REF,
  );
}
