import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDefaultAgentWorkspaceDir } from "./workspace.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DEFAULT_AGENT_WORKSPACE_DIR", () => {
  it("uses SUNCLAW_HOME when resolving the default workspace dir", () => {
    const home = path.join(path.sep, "srv", "sunclaw-home");
    vi.stubEnv("SUNCLAW_HOME", home);
    vi.stubEnv("HOME", path.join(path.sep, "home", "other"));

    expect(resolveDefaultAgentWorkspaceDir()).toBe(
      path.join(path.resolve(home), ".sunclaw", "workspace"),
    );
  });

  it("uses SUNCLAW_WORKSPACE_DIR before SUNCLAW_HOME", () => {
    const workspaceDir = path.join(path.sep, "srv", "sunclaw-workspace");
    vi.stubEnv("SUNCLAW_WORKSPACE_DIR", workspaceDir);
    vi.stubEnv("SUNCLAW_HOME", path.join(path.sep, "srv", "sunclaw-home"));

    expect(resolveDefaultAgentWorkspaceDir()).toBe(path.resolve(workspaceDir));
  });
});
