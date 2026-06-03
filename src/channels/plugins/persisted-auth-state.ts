import type { SunClawConfig } from "../../config/types.sunclaw.js";
import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
import {
  hasBundledChannelPackageState,
  listBundledChannelIdsForPackageState,
} from "./package-state-probes.js";

export function listBundledChannelIdsWithPersistedAuthState(
  discovery?: PluginDiscoveryResult,
): string[] {
  return listBundledChannelIdsForPackageState("persistedAuthState", discovery);
}

export function hasBundledChannelPersistedAuthState(params: {
  channelId: string;
  cfg: SunClawConfig;
  env?: NodeJS.ProcessEnv;
  discovery?: PluginDiscoveryResult;
}): boolean {
  return hasBundledChannelPackageState({
    metadataKey: "persistedAuthState",
    channelId: params.channelId,
    cfg: params.cfg,
    env: params.env,
    discovery: params.discovery,
  });
}
