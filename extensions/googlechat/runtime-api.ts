// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "sunclaw/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "sunclaw/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "sunclaw/plugin-sdk/channel-config-primitives";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "sunclaw/plugin-sdk/channel-contract";
export { missingTargetError } from "sunclaw/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "sunclaw/plugin-sdk/channel-outbound";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "sunclaw/plugin-sdk/channel-outbound";
export { PAIRING_APPROVED_MESSAGE } from "sunclaw/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "sunclaw/plugin-sdk/text-chunking";
export type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
export { GoogleChatConfigSchema } from "sunclaw/plugin-sdk/bundled-channel-config-schema";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "sunclaw/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "sunclaw/plugin-sdk/dangerous-name-runtime";
export {
  readRemoteMediaBuffer,
  resolveChannelMediaMaxBytes,
} from "sunclaw/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "sunclaw/plugin-sdk/outbound-media";
export type { PluginRuntime } from "sunclaw/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "sunclaw/plugin-sdk/ssrf-runtime";
export type {
  GoogleChatAccountConfig,
  GoogleChatConfig,
} from "sunclaw/plugin-sdk/config-contracts";
export { extractToolSend } from "sunclaw/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "sunclaw/plugin-sdk/channel-inbound";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "sunclaw/plugin-sdk/inbound-envelope";
export { resolveWebhookPath } from "sunclaw/plugin-sdk/webhook-ingress";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "sunclaw/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "sunclaw/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
