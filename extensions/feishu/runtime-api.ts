// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  SunClawConfig,
  SunClawPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "sunclaw/plugin-sdk/core";
export type { SunClawConfig as ClawdbotConfig } from "sunclaw/plugin-sdk/core";
export type RuntimeEnv = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  exit: (code: number) => void;
};
export type { GroupToolPolicyConfig } from "sunclaw/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "sunclaw/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "sunclaw/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "sunclaw/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "sunclaw/plugin-sdk/channel-outbound";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "sunclaw/plugin-sdk/context-visibility-runtime";
export {
  loadSessionStore,
  resolveSessionStoreEntry,
} from "sunclaw/plugin-sdk/session-store-runtime";
export { readJsonFileWithFallback } from "sunclaw/plugin-sdk/json-store";
export { normalizeAgentId } from "sunclaw/plugin-sdk/routing";
export { chunkTextForOutbound } from "sunclaw/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "sunclaw/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
