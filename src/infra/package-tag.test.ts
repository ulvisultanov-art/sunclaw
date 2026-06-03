import { describe, expect, it } from "vitest";
import { normalizePackageTagInput } from "./package-tag.js";

describe("normalizePackageTagInput", () => {
  const packageNames = ["sunclaw", "@sunclaw/plugin"] as const;

  it.each([
    { input: undefined, expected: null },
    { input: "   ", expected: null },
    { input: "sunclaw@beta", expected: "beta" },
    { input: "@sunclaw/plugin@2026.2.24", expected: "2026.2.24" },
    { input: "sunclaw@   ", expected: null },
    { input: "sunclaw", expected: null },
    { input: " @sunclaw/plugin ", expected: null },
    { input: " latest ", expected: "latest" },
    { input: "@other/plugin@beta", expected: "@other/plugin@beta" },
    { input: "sunclawer@beta", expected: "sunclawer@beta" },
  ] satisfies ReadonlyArray<{ input: string | undefined; expected: string | null }>)(
    "normalizes %j",
    ({ input, expected }) => {
      expect(normalizePackageTagInput(input, packageNames)).toBe(expected);
    },
  );
});
