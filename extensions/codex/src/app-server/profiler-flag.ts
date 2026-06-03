import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import { isDiagnosticFlagEnabled } from "sunclaw/plugin-sdk/diagnostic-runtime";

const PROFILER_FLAGS = ["profiler", "codex.profiler"] as const;

export function isCodexAppServerProfilerEnabled(
  config?: SunClawConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return PROFILER_FLAGS.some((flag) => isDiagnosticFlagEnabled(flag, config, env));
}
