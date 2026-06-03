import { describe, expect, it } from "vitest";
import { resolveSunClawAgentDir } from "./agent-dir-compat.js";

describe("resolveSunClawAgentDir", () => {
  it("keeps the shipped Pi env alias for deprecated plugin SDK callers", () => {
    expect(
      resolveSunClawAgentDir({
        PI_CODING_AGENT_DIR: "/tmp/sunclaw-legacy-agent",
      }),
    ).toBe("/tmp/sunclaw-legacy-agent");
  });

  it("prefers the SunClaw env override over the deprecated Pi alias", () => {
    expect(
      resolveSunClawAgentDir({
        SUNCLAW_AGENT_DIR: "/tmp/sunclaw-agent",
        PI_CODING_AGENT_DIR: "/tmp/sunclaw-legacy-agent",
      }),
    ).toBe("/tmp/sunclaw-agent");
  });
});
