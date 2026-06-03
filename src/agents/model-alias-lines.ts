import { normalizeOptionalString } from "@sunclaw/normalization-core/string-coerce";
import type { SunClawConfig } from "../config/types.sunclaw.js";

export function buildModelAliasLines(cfg?: SunClawConfig) {
  const models = cfg?.agents?.defaults?.models ?? {};
  const entries: Array<{ alias: string; model: string }> = [];
  for (const [keyRaw, entryRaw] of Object.entries(models)) {
    const model = normalizeOptionalString(keyRaw) ?? "";
    if (!model) {
      continue;
    }
    const alias =
      normalizeOptionalString((entryRaw as { alias?: string } | undefined)?.alias) ?? "";
    if (!alias) {
      continue;
    }
    entries.push({ alias, model });
  }
  return entries
    .toSorted((a, b) => a.alias.localeCompare(b.alias))
    .map((entry) => `- ${entry.alias}: ${entry.model}`);
}
