import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<SunClawConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
