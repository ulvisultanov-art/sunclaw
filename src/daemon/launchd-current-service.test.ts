import { describe, expect, it } from "vitest";
import { isCurrentProcessLaunchdServiceLabel } from "./launchd-current-service.js";

describe("isCurrentProcessLaunchdServiceLabel", () => {
  it("matches launchd-provided service labels", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.sunclaw.gateway", {
        LAUNCH_JOB_LABEL: "ai.sunclaw.gateway",
      }),
    ).toBe(true);
  });

  it("falls back to SunClaw service markers when XPC_SERVICE_NAME is inherited", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.sunclaw.gateway", {
        XPC_SERVICE_NAME: "0",
        SUNCLAW_SERVICE_MARKER: "sunclaw",
        SUNCLAW_SERVICE_KIND: "gateway",
        SUNCLAW_LAUNCHD_LABEL: "ai.sunclaw.gateway",
      }),
    ).toBe(true);
  });

  it("preserves label-only fallback when launchd exposes no label variables", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.sunclaw.gateway", {
        SUNCLAW_LAUNCHD_LABEL: "ai.sunclaw.gateway",
      }),
    ).toBe(true);
  });

  it("can require service markers for label-only fallback", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel(
        "ai.sunclaw.gateway",
        {
          SUNCLAW_LAUNCHD_LABEL: "ai.sunclaw.gateway",
        },
        { allowConfiguredLabelFallback: false },
      ),
    ).toBe(false);
  });

  it("does not treat unrelated inherited launchd labels as current services", () => {
    expect(
      isCurrentProcessLaunchdServiceLabel("ai.sunclaw.gateway", {
        XPC_SERVICE_NAME: "0",
        SUNCLAW_LAUNCHD_LABEL: "ai.sunclaw.gateway",
      }),
    ).toBe(false);
  });
});
