import { describe, expect, it } from "vitest";
import { testApi } from "./logger.js";

describe("shouldSkipMutatingLoggingConfigRead", () => {
  it("matches config schema and validate invocations", () => {
    expect(
      testApi.shouldSkipMutatingLoggingConfigRead(["node", "sunclaw", "config", "schema"]),
    ).toBe(true);
    expect(
      testApi.shouldSkipMutatingLoggingConfigRead(["node", "sunclaw", "config", "validate"]),
    ).toBe(true);
  });

  it("handles root flags before config validate", () => {
    expect(
      testApi.shouldSkipMutatingLoggingConfigRead([
        "node",
        "sunclaw",
        "--profile",
        "work",
        "--no-color",
        "config",
        "validate",
        "--json",
      ]),
    ).toBe(true);
  });

  it("does not match other commands", () => {
    expect(
      testApi.shouldSkipMutatingLoggingConfigRead(["node", "sunclaw", "config", "get", "foo"]),
    ).toBe(false);
    expect(testApi.shouldSkipMutatingLoggingConfigRead(["node", "sunclaw", "status"])).toBe(false);
  });
});
