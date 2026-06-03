import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnyAgentTool } from "./tools/common.js";

const mocks = vi.hoisted(() => {
  const stubTool = (name: string) =>
    ({
      name,
      label: name,
      displaySummary: name,
      description: name,
      parameters: { type: "object", properties: {} },
      execute: vi.fn(),
    }) satisfies AnyAgentTool;

  return {
    createSunClawToolsOptions: vi.fn(),
    stubTool,
  };
});

vi.mock("./sunclaw-tools.js", () => ({
  createSunClawTools: (options: unknown) => {
    mocks.createSunClawToolsOptions(options);
    return [mocks.stubTool("cron")];
  },
}));

import "./test-helpers/fast-bash-tools.js";
import "./test-helpers/fast-coding-tools.js";
import { createSunClawCodingTools } from "./agent-tools.js";

function firstSunClawToolsOptions(): { cronSelfRemoveOnlyJobId?: string } | undefined {
  return mocks.createSunClawToolsOptions.mock.calls[0]?.[0] as
    | { cronSelfRemoveOnlyJobId?: string }
    | undefined;
}

describe("createSunClawCodingTools cron scope", () => {
  beforeEach(() => {
    mocks.createSunClawToolsOptions.mockClear();
  });

  it("scopes cron-triggered jobs to self-removal", () => {
    const tools = createSunClawCodingTools({
      trigger: "cron",
      jobId: "job-current",
    });

    expect(tools.map((tool) => tool.name)).toContain("cron");
    expect(firstSunClawToolsOptions()?.cronSelfRemoveOnlyJobId).toBe("job-current");
  });

  it("does not scope non-cron sessions", () => {
    createSunClawCodingTools({
      trigger: "user",
      jobId: "job-current",
    });

    expect(firstSunClawToolsOptions()?.cronSelfRemoveOnlyJobId).toBeUndefined();
  });
});
