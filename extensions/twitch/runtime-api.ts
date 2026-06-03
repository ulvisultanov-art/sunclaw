// Private runtime barrel for the bundled Twitch extension.
// Keep this barrel thin and aligned with the local extension surface.

export type {
  ChannelAccountSnapshot,
  ChannelCapabilities,
  ChannelGatewayContext,
  ChannelLogSink,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
} from "sunclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "sunclaw/plugin-sdk/channel-core";
export type { OutboundDeliveryResult } from "sunclaw/plugin-sdk/channel-send-result";
export type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime";
export type { WizardPrompter } from "sunclaw/plugin-sdk/setup";
