import type { SunClawConfig } from "../../config/types.sunclaw.js";

export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<SunClawConfig["session"]>> = {},
): NonNullable<SunClawConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
