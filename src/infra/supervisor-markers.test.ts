import { describe, expect, it } from "vitest";
import { detectRespawnSupervisor, SUPERVISOR_HINT_ENV_VARS } from "./supervisor-markers.js";

describe("SUPERVISOR_HINT_ENV_VARS", () => {
  it("includes the cross-platform supervisor hint env vars", () => {
    const envVars = new Set(SUPERVISOR_HINT_ENV_VARS);
    expect(envVars.has("LAUNCH_JOB_LABEL")).toBe(true);
    expect(envVars.has("INVOCATION_ID")).toBe(true);
    expect(envVars.has("SUNCLAW_WINDOWS_TASK_NAME")).toBe(true);
    expect(envVars.has("SUNCLAW_SERVICE_MARKER")).toBe(true);
    expect(envVars.has("SUNCLAW_SERVICE_KIND")).toBe(true);
  });
});

describe("detectRespawnSupervisor", () => {
  it("detects launchd from SunClaw's explicit marker or current gateway launchd job", () => {
    expect(
      detectRespawnSupervisor({ SUNCLAW_LAUNCHD_LABEL: " ai.sunclaw.gateway " }, "darwin"),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ SUNCLAW_LAUNCHD_LABEL: "   " }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.sunclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
    expect(
      detectRespawnSupervisor(
        { LAUNCH_JOB_NAME: "ai.sunclaw.work", SUNCLAW_PROFILE: "work" },
        "darwin",
      ),
    ).toBe("launchd");
    expect(detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.sunclaw.mac" }, "darwin")).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.sunclaw.mac" }, "darwin")).toBeNull();
    expect(
      detectRespawnSupervisor(
        { XPC_SERVICE_NAME: "ai.sunclaw.mac", SUNCLAW_PROFILE: "mac" },
        "darwin",
      ),
    ).toBeNull();
    expect(detectRespawnSupervisor({ XPC_SERVICE_NAME: "ai.sunclaw.gateway" }, "darwin")).toBe(
      "launchd",
    );
  });

  it("detects systemd only from non-blank platform-specific hints", () => {
    expect(detectRespawnSupervisor({ INVOCATION_ID: "abc123" }, "linux")).toBe("systemd");
    expect(detectRespawnSupervisor({ JOURNAL_STREAM: "" }, "linux")).toBeNull();
  });

  it("detects scheduled-task supervision on Windows from either hint family", () => {
    expect(detectRespawnSupervisor({ SUNCLAW_WINDOWS_TASK_NAME: "SunClaw Gateway" }, "win32")).toBe(
      "schtasks",
    );
    expect(
      detectRespawnSupervisor(
        {
          SUNCLAW_SERVICE_MARKER: "sunclaw",
          SUNCLAW_SERVICE_KIND: "gateway",
        },
        "win32",
      ),
    ).toBe("schtasks");
    expect(
      detectRespawnSupervisor(
        {
          SUNCLAW_SERVICE_MARKER: "sunclaw",
          SUNCLAW_SERVICE_KIND: "worker",
        },
        "win32",
      ),
    ).toBeNull();
  });

  it("ignores service markers on non-Windows platforms and unknown platforms", () => {
    expect(
      detectRespawnSupervisor(
        {
          SUNCLAW_SERVICE_MARKER: "sunclaw",
          SUNCLAW_SERVICE_KIND: "gateway",
        },
        "linux",
      ),
    ).toBeNull();
    expect(
      detectRespawnSupervisor({ LAUNCH_JOB_LABEL: "ai.sunclaw.gateway" }, "freebsd"),
    ).toBeNull();
  });
});
