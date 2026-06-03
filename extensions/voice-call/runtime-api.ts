// Private runtime barrel for the bundled Voice Call extension.
// Keep this barrel thin and aligned with the local extension surface.

export { definePluginEntry } from "sunclaw/plugin-sdk/plugin-entry";
export type { SunClawPluginApi } from "sunclaw/plugin-sdk/plugin-entry";
export type { GatewayRequestHandlerOptions } from "sunclaw/plugin-sdk/gateway-runtime";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "sunclaw/plugin-sdk/webhook-request-guards";
export { fetchWithSsrFGuard, isBlockedHostnameOrIp } from "sunclaw/plugin-sdk/ssrf-runtime";
export type { SessionEntry } from "sunclaw/plugin-sdk/session-store-runtime";
export {
  TtsAutoSchema,
  TtsConfigSchema,
  TtsModeSchema,
  TtsProviderSchema,
} from "sunclaw/plugin-sdk/tts-runtime";
export { sleep } from "sunclaw/plugin-sdk/runtime-env";
