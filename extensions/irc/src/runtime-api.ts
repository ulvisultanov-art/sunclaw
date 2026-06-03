// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "sunclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "sunclaw/plugin-sdk/channel-core";
export type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
export type { PluginRuntime } from "sunclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "sunclaw/plugin-sdk/config-contracts";
export type { OutboundReplyPayload } from "sunclaw/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "sunclaw/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "sunclaw/plugin-sdk/channel-config-primitives";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "sunclaw/plugin-sdk/channel-status";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "sunclaw/plugin-sdk/channel-outbound";
export { resolveControlCommandGate } from "sunclaw/plugin-sdk/command-auth-native";
export { createChannelMessageReplyPipeline } from "sunclaw/plugin-sdk/channel-outbound";
export { chunkTextForOutbound } from "sunclaw/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "sunclaw/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "sunclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "sunclaw/plugin-sdk/dangerous-name-runtime";
export { logInboundDrop } from "sunclaw/plugin-sdk/channel-inbound";
