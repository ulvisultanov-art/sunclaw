// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  SunClawConfig,
  SunClawPluginApi,
  PluginRuntime,
} from "sunclaw/plugin-sdk/core";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export type { ReplyPayload } from "sunclaw/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "sunclaw/plugin-sdk/models-provider-runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "sunclaw/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "sunclaw/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "sunclaw/plugin-sdk/channel-status";
export { createAccountStatusSink } from "sunclaw/plugin-sdk/channel-outbound";
export { buildAgentMediaPayload } from "sunclaw/plugin-sdk/agent-media-payload";
export {
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "sunclaw/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "sunclaw/plugin-sdk/models-provider-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "sunclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "sunclaw/plugin-sdk/dangerous-name-runtime";
export { loadSessionStore, resolveStorePath } from "sunclaw/plugin-sdk/session-store-runtime";
export { formatInboundFromLabel } from "sunclaw/plugin-sdk/channel-inbound";
export { logInboundDrop } from "sunclaw/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "sunclaw/plugin-sdk/channel-outbound";
export { logTypingFailure } from "sunclaw/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "sunclaw/plugin-sdk/outbound-media";
export { rawDataToString } from "sunclaw/plugin-sdk/webhook-ingress";
export { chunkTextForOutbound } from "sunclaw/plugin-sdk/text-chunking";
// Legacy map-helper exports stay for older plugin consumers. New message-turn
// code should use createChannelHistoryWindow.
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  createChannelHistoryWindow,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "sunclaw/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "sunclaw/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "sunclaw/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "sunclaw/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "sunclaw/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "sunclaw/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "sunclaw/plugin-sdk/media-runtime";
export { normalizeProviderId } from "sunclaw/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
