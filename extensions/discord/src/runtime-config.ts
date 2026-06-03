import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
  selectApplicableRuntimeConfig,
} from "sunclaw/plugin-sdk/runtime-config-snapshot";
import type { SunClawConfig } from "./runtime-api.js";

export function selectDiscordRuntimeConfig(inputConfig: SunClawConfig): SunClawConfig {
  return (
    selectApplicableRuntimeConfig({
      inputConfig,
      runtimeConfig: getRuntimeConfigSnapshot(),
      runtimeSourceConfig: getRuntimeConfigSourceSnapshot(),
    }) ?? inputConfig
  );
}
