import type { SunClawConfig } from "./runtime-api.js";
import { inspectTelegramAccount } from "./src/account-inspect.js";

export function inspectTelegramReadOnlyAccount(cfg: SunClawConfig, accountId?: string | null) {
  return inspectTelegramAccount({ cfg, accountId });
}
