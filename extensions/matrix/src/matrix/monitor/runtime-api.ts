// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "sunclaw/plugin-sdk/channel-inbound";
export type { PluginRuntime, RuntimeLogger } from "sunclaw/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "sunclaw/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  formatAllowlistMatchMeta,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "sunclaw/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "sunclaw/plugin-sdk/channel-outbound";
export { formatLocationText, toLocationContext } from "sunclaw/plugin-sdk/channel-inbound";
export { getAgentScopedMediaLocalRoots } from "sunclaw/plugin-sdk/agent-media-payload";
export { logInboundDrop } from "sunclaw/plugin-sdk/channel-inbound";
export { logTypingFailure } from "sunclaw/plugin-sdk/channel-outbound";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "sunclaw/plugin-sdk/channel-targets";
