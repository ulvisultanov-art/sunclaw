import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { SunClawConfig } from "../../config/types.js";

export { resolveActiveTalkProviderConfig };

export function getRuntimeConfigSnapshot(): SunClawConfig | null {
  return null;
}
