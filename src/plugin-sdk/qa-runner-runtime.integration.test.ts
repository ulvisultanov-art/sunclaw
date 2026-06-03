import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as activationCheckRuntime from "./facade-activation-check.runtime.js";
import {
  testing as facadeRuntimeTesting,
  resetFacadeRuntimeStateForTest,
} from "./facade-runtime.js";
import { listQaRunnerCliContributions } from "./qa-runner-runtime.js";

const ORIGINAL_ENV = {
  SUNCLAW_DISABLE_BUNDLED_PLUGINS: process.env.SUNCLAW_DISABLE_BUNDLED_PLUGINS,
  SUNCLAW_CONFIG_PATH: process.env.SUNCLAW_CONFIG_PATH,
  SUNCLAW_STATE_DIR: process.env.SUNCLAW_STATE_DIR,
  SUNCLAW_TEST_FAST: process.env.SUNCLAW_TEST_FAST,
} as const;

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function resetQaRunnerRuntimeState() {
  resetFacadeRuntimeStateForTest();
  facadeRuntimeTesting.setFacadeActivationCheckRuntimeForTest(activationCheckRuntime);
}

describe("plugin-sdk qa-runner-runtime linked plugin smoke", () => {
  beforeEach(() => {
    resetQaRunnerRuntimeState();
    process.env.SUNCLAW_DISABLE_BUNDLED_PLUGINS = "1";
    process.env.SUNCLAW_TEST_FAST = "1";
  });

  afterEach(() => {
    resetQaRunnerRuntimeState();
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("loads an activated qa runner from a linked plugin path without a bundled install fallback", async () => {
    const stateDir = makeTempDir("sunclaw-qa-runner-state-");
    const pluginDir = path.join(stateDir, "extensions", "qa-linked");
    const configPath = path.join(stateDir, "sunclaw.json");

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        plugins: {},
      }),
      "utf8",
    );
    process.env.SUNCLAW_CONFIG_PATH = configPath;
    process.env.SUNCLAW_STATE_DIR = stateDir;

    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(
      path.join(pluginDir, "sunclaw.plugin.json"),
      JSON.stringify({
        id: "qa-linked",
        qaRunners: [
          {
            commandName: "linked",
            description: "Run the linked QA lane",
          },
        ],
        configSchema: {
          type: "object",
          additionalProperties: false,
          properties: {},
        },
      }),
      "utf8",
    );
    fs.writeFileSync(
      path.join(pluginDir, "package.json"),
      JSON.stringify({
        name: "@sunclaw/qa-linked",
        type: "module",
        sunclaw: {
          extensions: ["./index.js"],
          install: {
            npmSpec: "@sunclaw/qa-linked",
          },
        },
      }),
      "utf8",
    );
    fs.writeFileSync(path.join(pluginDir, "index.js"), "export default {};\n", "utf8");
    fs.writeFileSync(
      path.join(pluginDir, "runtime-api.js"),
      [
        "export const qaRunnerCliRegistrations = [",
        "  {",
        '    commandName: "linked",',
        "    register() {}",
        "  }",
        "];",
      ].join("\n"),
      "utf8",
    );

    const contributions = listQaRunnerCliContributions();
    const contribution = contributions[0];
    expect(contribution?.status).toBe("available");
    if (!contribution || contribution.status !== "available") {
      throw new Error("Expected linked QA runner contribution to be available");
    }
    const register = contribution.registration["register"];
    expect(typeof register).toBe("function");
    expect(contributions).toEqual([
      {
        pluginId: "qa-linked",
        commandName: "linked",
        description: "Run the linked QA lane",
        status: "available",
        registration: {
          commandName: "linked",
          register,
        },
      },
    ]);
  });
});
