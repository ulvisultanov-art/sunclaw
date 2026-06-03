import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: SunClawConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
