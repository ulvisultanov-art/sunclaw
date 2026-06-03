import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: SunClawConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
