import type { AgentPromptSurfaceKind } from "./types.js";

export function normalizeAgentPromptSurfaceKind(
  surface: AgentPromptSurfaceKind,
): AgentPromptSurfaceKind {
  return surface === "pi_main" ? "sunclaw_main" : surface;
}

export function isSunClawMainPromptSurface(surface: AgentPromptSurfaceKind): boolean {
  return normalizeAgentPromptSurfaceKind(surface) === "sunclaw_main";
}
