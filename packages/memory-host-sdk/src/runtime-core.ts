// Focused runtime contract for memory plugin config/state/helpers.

export type { AnyAgentTool } from "./host/sunclaw-runtime-agent.js";
export { resolveCronStyleNow } from "./host/sunclaw-runtime-agent.js";
export { DEFAULT_AGENT_COMPACTION_RESERVE_TOKENS_FLOOR } from "./host/sunclaw-runtime-agent.js";
export { resolveDefaultAgentId, resolveSessionAgentId } from "./host/sunclaw-runtime-agent.js";
export { resolveMemorySearchConfig } from "./host/sunclaw-runtime-agent.js";
export {
  asToolParamsRecord,
  jsonResult,
  readNumberParam,
  readStringParam,
} from "./host/sunclaw-runtime-agent.js";
export { SILENT_REPLY_TOKEN } from "./host/sunclaw-runtime-session.js";
export { parseNonNegativeByteSize } from "./host/sunclaw-runtime-config.js";
export {
  getRuntimeConfig,
  /** @deprecated Use getRuntimeConfig(), or pass the already loaded config through the call path. */
  loadConfig,
} from "./host/sunclaw-runtime-config.js";
export { resolveStateDir } from "./host/sunclaw-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/sunclaw-runtime-config.js";
export { emptyPluginConfigSchema } from "./host/sunclaw-runtime-memory.js";
export {
  buildActiveMemoryPromptSection,
  getMemoryCapabilityRegistration,
  listActiveMemoryPublicArtifacts,
} from "./host/sunclaw-runtime-memory.js";
export { parseAgentSessionKey } from "./host/sunclaw-runtime-agent.js";
export type { SunClawConfig } from "./host/sunclaw-runtime-config.js";
export type { MemoryCitationsMode } from "./host/sunclaw-runtime-config.js";
export type {
  MemoryFlushPlan,
  MemoryFlushPlanResolver,
  MemoryPluginCapability,
  MemoryPluginPublicArtifact,
  MemoryPluginPublicArtifactsProvider,
  MemoryPluginRuntime,
  MemoryPromptSectionBuilder,
} from "./host/sunclaw-runtime-memory.js";
export type { SunClawPluginApi } from "./host/sunclaw-runtime-memory.js";
