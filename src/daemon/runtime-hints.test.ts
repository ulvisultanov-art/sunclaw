import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          HOME: "/Users/test",
          SUNCLAW_STATE_DIR: "/tmp/sunclaw-state",
          SUNCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "sunclaw-gateway",
        windowsTaskName: "SunClaw Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /Users/test/Library/Logs/sunclaw/gateway.log",
      "Launchd stderr (if installed): suppressed",
      "Restart attempts: /tmp/sunclaw-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          SUNCLAW_STATE_DIR: "/tmp/sunclaw-state",
        },
        systemdServiceName: "sunclaw-gateway",
        windowsTaskName: "SunClaw Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u sunclaw-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/sunclaw-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          SUNCLAW_STATE_DIR: "/tmp/sunclaw-state",
        },
        systemdServiceName: "sunclaw-gateway",
        windowsTaskName: "SunClaw Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "SunClaw Gateway" /V /FO LIST',
      "Restart attempts: /tmp/sunclaw-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "sunclaw gateway install",
        startCommand: "sunclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.sunclaw.gateway.plist",
        systemdServiceName: "sunclaw-gateway",
        windowsTaskName: "SunClaw Gateway",
      }),
    ).toEqual([
      "sunclaw gateway install",
      "sunclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.sunclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "sunclaw gateway install",
        startCommand: "sunclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.sunclaw.gateway.plist",
        systemdServiceName: "sunclaw-gateway",
        windowsTaskName: "SunClaw Gateway",
      }),
    ).toEqual([
      "sunclaw gateway install",
      "sunclaw gateway",
      "systemctl --user start sunclaw-gateway.service",
    ]);
  });
});
