import type { ChannelPlugin } from "sunclaw/plugin-sdk/channel-core";
import type { ResolvedGoogleChatAccount } from "./accounts.js";
import { createGoogleChatPluginBase } from "./channel-base.js";

export const googlechatSetupPlugin: ChannelPlugin<ResolvedGoogleChatAccount> =
  createGoogleChatPluginBase();
