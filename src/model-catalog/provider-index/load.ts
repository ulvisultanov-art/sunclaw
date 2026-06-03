import { normalizeSunClawProviderIndex } from "./normalize.js";
import { SUNCLAW_PROVIDER_INDEX } from "./sunclaw-provider-index.js";
import type { SunClawProviderIndex } from "./types.js";

export function loadSunClawProviderIndex(
  source: unknown = SUNCLAW_PROVIDER_INDEX,
): SunClawProviderIndex {
  return normalizeSunClawProviderIndex(source) ?? { version: 1, providers: {} };
}
