import { normalizeOptionalString } from "@sunclaw/normalization-core/string-coerce";

export function normalizeHeartbeatWakeReason(reason?: string): string {
  return normalizeOptionalString(reason) ?? "requested";
}
