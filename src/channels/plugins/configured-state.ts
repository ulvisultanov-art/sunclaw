import type { SunClawConfig } from "../../config/types.sunclaw.js";
import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
import {
  hasBundledChannelPackageState,
  listBundledChannelIdsForPackageState,
} from "./package-state-probes.js";

export function listBundledChannelIdsWithConfiguredState(
  discovery?: PluginDiscoveryResult,
): string[] {
  return listBundledChannelIdsForPackageState("configuredState", discovery);
}

export function hasBundledChannelConfiguredState(params: {
  channelId: string;
  cfg: SunClawConfig;
  env?: NodeJS.ProcessEnv;
  discovery?: PluginDiscoveryResult;
}): boolean {
  return hasBundledChannelPackageState({
    metadataKey: "configuredState",
    channelId: params.channelId,
    cfg: params.cfg,
    env: params.env,
    discovery: params.discovery,
  });
}
