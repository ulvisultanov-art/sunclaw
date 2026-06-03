import { describe, expect, it } from "vitest";
import { isSunClawManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects SunClaw-managed device names", () => {
    expect(isSunClawManagedMatrixDevice("SunClaw Gateway")).toBe(true);
    expect(isSunClawManagedMatrixDevice("SunClaw Debug")).toBe(true);
    expect(isSunClawManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isSunClawManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale SunClaw-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "SunClaw Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "SunClaw Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "SunClaw Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary).toEqual({
      currentDeviceId: "du314Zpw3A",
      currentSunClawDevices: [
        {
          deviceId: "du314Zpw3A",
          displayName: "SunClaw Gateway",
          current: true,
        },
      ],
      staleSunClawDevices: [
        {
          deviceId: "BritdXC6iL",
          displayName: "SunClaw Gateway",
          current: false,
        },
        {
          deviceId: "G6NJU9cTgs",
          displayName: "SunClaw Debug",
          current: false,
        },
      ],
    });
  });
});
