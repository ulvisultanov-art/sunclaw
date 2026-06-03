import {
  resolveChannelPreviewStreamMode,
  type StreamingMode,
} from "sunclaw/plugin-sdk/channel-outbound";

type TelegramPreviewStreamMode = StreamingMode;

export function resolveTelegramPreviewStreamMode(
  params: {
    streamMode?: unknown;
    streaming?: unknown;
  } = {},
): TelegramPreviewStreamMode {
  return resolveChannelPreviewStreamMode(params, "partial");
}
