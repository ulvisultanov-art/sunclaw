import { normalizeOptionalString } from "@sunclaw/normalization-core/string-coerce";

export function resolveDaemonContainerContext(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return (
    normalizeOptionalString(env.SUNCLAW_CONTAINER_HINT) ||
    normalizeOptionalString(env.SUNCLAW_CONTAINER) ||
    null
  );
}
