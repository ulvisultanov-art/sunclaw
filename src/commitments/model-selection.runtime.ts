import { resolveDefaultModelForAgent } from "../agents/model-selection.js";
import type { SunClawConfig } from "../config/config.js";

export function resolveCommitmentDefaultModelRef(params: {
  cfg: SunClawConfig;
  agentId?: string;
}): { provider: string; model: string } {
  return resolveDefaultModelForAgent(params);
}
