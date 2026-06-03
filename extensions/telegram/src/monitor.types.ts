import type {
  ChannelAccountSnapshot,
  ChannelRuntimeSurface,
} from "sunclaw/plugin-sdk/channel-contract";
import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import type { RuntimeEnv } from "sunclaw/plugin-sdk/runtime-env";
import type { TelegramBotInfo } from "./bot-info.js";

export type MonitorTelegramOpts = {
  token?: string;
  accountId?: string;
  config?: SunClawConfig;
  runtime?: RuntimeEnv;
  channelRuntime?: ChannelRuntimeSurface;
  abortSignal?: AbortSignal;
  useWebhook?: boolean;
  webhookPath?: string;
  webhookPort?: number;
  webhookSecret?: string;
  webhookHost?: string;
  proxyFetch?: typeof fetch;
  webhookUrl?: string;
  webhookCertPath?: string;
  botInfo?: TelegramBotInfo;
  setStatus?: (patch: Omit<ChannelAccountSnapshot, "accountId">) => void;
  isolatedIngress?: {
    enabled?: boolean;
  };
};

export type TelegramMonitorFn = (opts?: MonitorTelegramOpts) => Promise<void>;
