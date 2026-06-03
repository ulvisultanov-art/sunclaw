import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import type { SunClawPluginToolContext } from "sunclaw/plugin-sdk/plugin-entry";
import type { SunClawPluginApi } from "sunclaw/plugin-sdk/plugin-runtime";

export type TavilyToolConfigContext = Pick<
  SunClawPluginToolContext,
  "config" | "runtimeConfig" | "getRuntimeConfig"
>;

export function resolveTavilyToolConfig(
  api: SunClawPluginApi,
  ctx?: TavilyToolConfigContext,
): SunClawConfig {
  return ctx?.getRuntimeConfig?.() ?? ctx?.runtimeConfig ?? ctx?.config ?? api.config;
}
