import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<SunClawConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
