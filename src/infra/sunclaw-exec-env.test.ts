import { describe, expect, it } from "vitest";
import {
  ensureSunClawExecMarkerOnProcess,
  markSunClawExecEnv,
  SUNCLAW_CLI_ENV_VALUE,
  SUNCLAW_CLI_ENV_VAR,
} from "./sunclaw-exec-env.js";

describe("markSunClawExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", SUNCLAW_CLI: "0" };
    const marked = markSunClawExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      SUNCLAW_CLI: SUNCLAW_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.SUNCLAW_CLI).toBe("0");
  });
});

describe("ensureSunClawExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [SUNCLAW_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureSunClawExecMarkerOnProcess(env)).toBe(env);
    expect(env[SUNCLAW_CLI_ENV_VAR]).toBe(SUNCLAW_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[SUNCLAW_CLI_ENV_VAR];
    delete process.env[SUNCLAW_CLI_ENV_VAR];

    try {
      expect(ensureSunClawExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[SUNCLAW_CLI_ENV_VAR]).toBe(SUNCLAW_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[SUNCLAW_CLI_ENV_VAR];
      } else {
        process.env[SUNCLAW_CLI_ENV_VAR] = previous;
      }
    }
  });
});
