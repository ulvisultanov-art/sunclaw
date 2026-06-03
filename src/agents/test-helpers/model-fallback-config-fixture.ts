import type { SunClawConfig } from "../../config/types.sunclaw.js";

export function makeModelFallbackCfg(overrides: Partial<SunClawConfig> = {}): SunClawConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as SunClawConfig;
}
