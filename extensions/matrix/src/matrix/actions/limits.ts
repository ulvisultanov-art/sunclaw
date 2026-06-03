import { resolveIntegerOption } from "sunclaw/plugin-sdk/number-runtime";

export function resolveMatrixActionLimit(raw: unknown, fallback: number): number {
  return resolveIntegerOption(raw, fallback, { min: 1 });
}
