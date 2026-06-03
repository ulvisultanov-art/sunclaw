// Private runtime barrel for the bundled Nextcloud Talk extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { AllowlistMatch } from "sunclaw/plugin-sdk/allow-from";
export type { ChannelGroupContext } from "sunclaw/plugin-sdk/channel-contract";
export { logInboundDrop } from "sunclaw/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "sunclaw/plugin-sdk/channel-pairing";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyConfig,
  SunClawConfig,
} from "sunclaw/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "sunclaw/plugin-sdk/runtime-group-policy";
export { createChannelMessageReplyPipeline } from "sunclaw/plugin-sdk/channel-outbound";
export type { OutboundReplyPayload } from "sunclaw/plugin-sdk/reply-payload";
export { deliverFormattedTextWithAttachments } from "sunclaw/plugin-sdk/reply-payload";
export type { PluginRuntime } from "sunclaw/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export type { SecretInput } from "sunclaw/plugin-sdk/secret-input";
export { fetchWithSsrFGuard } from "sunclaw/plugin-sdk/ssrf-runtime";
export { setNextcloudTalkRuntime } from "./src/runtime.js";
