import { resolveAgentMaxConcurrent, resolveSubagentMaxConcurrent } from "../config/agent-limits.js";
import { resolveCronMaxConcurrentRuns } from "../config/cron-limits.js";
import type { SunClawConfig } from "../config/types.sunclaw.js";
import { setCommandLaneConcurrency } from "../process/command-queue.js";
import { CommandLane } from "../process/lanes.js";

export function applyGatewayLaneConcurrency(cfg: SunClawConfig) {
  const cronMaxConcurrentRuns = resolveCronMaxConcurrentRuns(cfg.cron);
  setCommandLaneConcurrency(CommandLane.Cron, cronMaxConcurrentRuns);
  // Cron isolated agent turns remap inner LLM work to this lane.
  setCommandLaneConcurrency(CommandLane.CronNested, cronMaxConcurrentRuns);
  setCommandLaneConcurrency(CommandLane.Main, resolveAgentMaxConcurrent(cfg));
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
}
