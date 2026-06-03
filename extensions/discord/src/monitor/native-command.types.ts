import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import type { CommandArgValues } from "sunclaw/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<SunClawConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
