import { applyPluginAutoEnable } from "../config/plugin-auto-enable.js";
import type { SunClawConfig } from "../config/types.sunclaw.js";
import { getCurrentPluginMetadataSnapshot } from "../plugins/current-plugin-metadata-snapshot.js";
import type { PluginMetadataSnapshot } from "../plugins/plugin-metadata-snapshot.types.js";

type CachedGatewayPluginConfig = {
  snapshot: PluginMetadataSnapshot;
  config: SunClawConfig;
};

const gatewayPluginConfigCache = new WeakMap<SunClawConfig, CachedGatewayPluginConfig>();

export function resolveGatewayPluginConfig(params: { config: SunClawConfig }): SunClawConfig {
  const currentSnapshot = getCurrentPluginMetadataSnapshot({
    config: params.config,
    allowWorkspaceScopedSnapshot: true,
  });
  if (!currentSnapshot) {
    return applyPluginAutoEnable({
      config: params.config,
    }).config;
  }

  const cached = gatewayPluginConfigCache.get(params.config);
  if (cached?.snapshot === currentSnapshot) {
    return cached.config;
  }

  const config = applyPluginAutoEnable({
    config: params.config,
    manifestRegistry: currentSnapshot.manifestRegistry,
    discovery: currentSnapshot.discovery,
  }).config;
  gatewayPluginConfigCache.set(params.config, { snapshot: currentSnapshot, config });
  return config;
}
