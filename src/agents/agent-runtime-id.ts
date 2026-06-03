export type EmbeddedAgentRuntime = "sunclaw" | "auto" | (string & {});

export const SUNCLAW_AGENT_RUNTIME_ID = "sunclaw";
export const AUTO_AGENT_RUNTIME_ID = "auto";

export function normalizeEmbeddedAgentRuntime(raw: string | undefined): EmbeddedAgentRuntime {
  const value = raw?.trim();
  if (!value) {
    return SUNCLAW_AGENT_RUNTIME_ID;
  }
  if (value === "sunclaw" || value === "pi") {
    return SUNCLAW_AGENT_RUNTIME_ID;
  }
  if (value === "auto") {
    return AUTO_AGENT_RUNTIME_ID;
  }
  if (value === "codex-app-server") {
    return "codex";
  }
  return value;
}

export function normalizeOptionalAgentRuntimeId(raw: unknown): EmbeddedAgentRuntime | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const value = raw.trim().toLowerCase();
  return value ? normalizeEmbeddedAgentRuntime(value) : undefined;
}

/**
 * @deprecated Whole-agent runtime environment selection is retired. Use
 * provider/model runtime policy or a registered agent harness instead.
 */
export function resolveEmbeddedAgentRuntime(
  _env: NodeJS.ProcessEnv = process.env,
): EmbeddedAgentRuntime {
  return SUNCLAW_AGENT_RUNTIME_ID;
}

export function isDefaultAgentRuntimeId(runtime: string | undefined): boolean {
  return runtime === undefined || runtime === AUTO_AGENT_RUNTIME_ID || runtime === "default";
}
