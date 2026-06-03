import { describe, expect, it } from "vitest";
import { formatCliFailureLines } from "./failure-output.js";

describe("formatCliFailureLines", () => {
  it("shows a concise reason and recovery commands by default", () => {
    const lines = formatCliFailureLines({
      title: "Could not start the CLI.",
      error: new Error("config file is invalid"),
      argv: ["node", "sunclaw", "status"],
      env: {},
    });

    expect(lines).toEqual([
      "[sunclaw] Could not start the CLI.",
      "[sunclaw] Reason: config file is invalid",
      "[sunclaw] Debug: set SUNCLAW_DEBUG=1 to include the stack trace.",
      "[sunclaw] Try: sunclaw doctor",
      "[sunclaw] Help: sunclaw --help",
    ]);
  });

  it("prints stack details when debug output is requested", () => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      env: { SUNCLAW_DEBUG: "1" },
    });

    expect(lines.slice(0, 4)).toEqual([
      "[sunclaw] The CLI command failed.",
      "[sunclaw] Reason: boom",
      "[sunclaw] Stack:",
      "[sunclaw] Error: boom",
    ]);
    expect(lines.join("\n")).toContain("Error: boom");
  });
});
