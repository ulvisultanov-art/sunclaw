// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export { DEFAULT_ACCOUNT_ID } from "sunclaw/plugin-sdk/account-id";
export type { AllowlistMatch } from "sunclaw/plugin-sdk/allow-from";
export {
  mergeAllowlist,
  resolveAllowlistMatchSimple,
  summarizeMapping,
} from "sunclaw/plugin-sdk/allow-from";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelOutboundAdapter,
} from "sunclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "sunclaw/plugin-sdk/channel-core";
export { logTypingFailure } from "sunclaw/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export { resolveToolsBySender } from "sunclaw/plugin-sdk/channel-policy";
export { createChannelMessageReplyPipeline } from "sunclaw/plugin-sdk/channel-outbound";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "sunclaw/plugin-sdk/channel-status";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "sunclaw/plugin-sdk/channel-targets";
export type {
  GroupPolicy,
  GroupToolPolicyConfig,
  MSTeamsChannelConfig,
  MSTeamsCloudName,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
  MarkdownTableMode,
  SunClawConfig,
} from "sunclaw/plugin-sdk/config-contracts";
export { isDangerousNameMatchingEnabled } from "sunclaw/plugin-sdk/dangerous-name-runtime";
export { resolveDefaultGroupPolicy } from "sunclaw/plugin-sdk/runtime-group-policy";
export { withFileLock } from "sunclaw/plugin-sdk/file-lock";
export { keepHttpServerTaskAlive } from "sunclaw/plugin-sdk/channel-outbound";
export {
  detectMime,
  extensionForMime,
  extractOriginalFilename,
  getFileExtension,
  resolveChannelMediaMaxBytes,
} from "sunclaw/plugin-sdk/media-runtime";
export { dispatchReplyFromConfigWithSettledDispatcher } from "sunclaw/plugin-sdk/channel-inbound";
export { loadOutboundMediaFromUrl } from "sunclaw/plugin-sdk/outbound-media";
export { buildMediaPayload } from "sunclaw/plugin-sdk/reply-payload";
export type { ReplyPayload } from "sunclaw/plugin-sdk/reply-payload";
export type { PluginRuntime } from "sunclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export type { SsrFPolicy } from "sunclaw/plugin-sdk/ssrf-runtime";
export { fetchWithSsrFGuard } from "sunclaw/plugin-sdk/ssrf-runtime";
export { normalizeStringEntries } from "sunclaw/plugin-sdk/string-normalization-runtime";
export { chunkTextForOutbound } from "sunclaw/plugin-sdk/text-chunking";
export { DEFAULT_WEBHOOK_MAX_BODY_BYTES } from "sunclaw/plugin-sdk/webhook-ingress";
export { setMSTeamsRuntime } from "./src/runtime.js";
