import { describe, expect, it } from "vitest";
import { createPluginToolsMcpHandlers } from "./plugin-tools-handlers.js";
import { resolveSunClawToolsForMcp } from "./sunclaw-tools-serve.js";

describe("SunClaw tools MCP server", () => {
  it("exposes cron", async () => {
    const handlers = createPluginToolsMcpHandlers(resolveSunClawToolsForMcp());

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toContain("cron");
  });
});
