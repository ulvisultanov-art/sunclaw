import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";

export type SignalAccountConfig = Omit<
  Exclude<NonNullable<SunClawConfig["channels"]>["signal"], undefined>,
  "accounts"
>;
