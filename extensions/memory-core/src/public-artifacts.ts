import {
  listMemoryHostPublicArtifacts,
  type MemoryPluginPublicArtifact,
} from "sunclaw/plugin-sdk/memory-host-core";
import type { SunClawConfig } from "../api.js";

export async function listMemoryCorePublicArtifacts(params: {
  cfg: SunClawConfig;
}): Promise<MemoryPluginPublicArtifact[]> {
  return await listMemoryHostPublicArtifacts(params);
}
