import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSunClawTestState, withSunClawTestState } from "./sunclaw-test-state.js";

async function expectPathMissing(targetPath: string): Promise<void> {
  try {
    await fs.stat(targetPath);
  } catch (error) {
    expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
    return;
  }
  throw new Error(`expected missing path: ${targetPath}`);
}

describe("sunclaw test state", () => {
  it("creates an isolated home layout with spawn env and restores process env", async () => {
    const previousHome = process.env.HOME;
    const previousSunClawHome = process.env.SUNCLAW_HOME;
    const previousStateDir = process.env.SUNCLAW_STATE_DIR;
    const previousConfigPath = process.env.SUNCLAW_CONFIG_PATH;

    const state = await createSunClawTestState({
      label: "unit",
      scenario: "minimal",
    });

    try {
      expect(state.home).toBe(path.join(state.root, "home"));
      expect(state.stateDir).toBe(path.join(state.home, ".sunclaw"));
      expect(state.configPath).toBe(path.join(state.stateDir, "sunclaw.json"));
      expect(state.workspaceDir).toBe(path.join(state.home, "workspace"));
      expect(state.env.HOME).toBe(state.home);
      expect(state.env.SUNCLAW_HOME).toBe(state.home);
      expect(state.env.SUNCLAW_STATE_DIR).toBe(state.stateDir);
      expect(state.env.SUNCLAW_CONFIG_PATH).toBe(state.configPath);
      expect(process.env.HOME).toBe(state.home);
      expect(process.env.SUNCLAW_HOME).toBe(state.home);
      expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toStrictEqual({});
    } finally {
      await state.cleanup();
    }

    expect(process.env.HOME).toBe(previousHome);
    expect(process.env.SUNCLAW_HOME).toBe(previousSunClawHome);
    expect(process.env.SUNCLAW_STATE_DIR).toBe(previousStateDir);
    expect(process.env.SUNCLAW_CONFIG_PATH).toBe(previousConfigPath);
    await expectPathMissing(state.root);
  });

  it("supports state-only layout without overriding HOME", async () => {
    const previousHome = process.env.HOME;

    await withSunClawTestState(
      {
        layout: "state-only",
        scenario: "empty",
      },
      async (state) => {
        expect(process.env.HOME).toBe(previousHome);
        expect(process.env.SUNCLAW_STATE_DIR).toBe(state.stateDir);
        expect(process.env.SUNCLAW_CONFIG_PATH).toBe(state.configPath);
        expect(state.env.HOME).toBe(previousHome);
        await expectPathMissing(state.configPath);
      },
    );
  });

  it("clears inherited agent-dir overrides by default", async () => {
    const previousAgentDir = process.env.SUNCLAW_AGENT_DIR;
    process.env.SUNCLAW_AGENT_DIR = "/tmp/outside-sunclaw-agent";

    try {
      const state = await createSunClawTestState({
        layout: "state-only",
      });

      try {
        expect(process.env.SUNCLAW_AGENT_DIR).toBeUndefined();
        expect(state.env.SUNCLAW_AGENT_DIR).toBeUndefined();
        expect(state.agentDir()).toBe(path.join(state.stateDir, "agents", "main", "agent"));
      } finally {
        await state.cleanup();
      }

      expect(process.env.SUNCLAW_AGENT_DIR).toBe("/tmp/outside-sunclaw-agent");
    } finally {
      if (previousAgentDir === undefined) {
        delete process.env.SUNCLAW_AGENT_DIR;
      } else {
        process.env.SUNCLAW_AGENT_DIR = previousAgentDir;
      }
    }
  });

  it("allows explicit agent-dir overrides when a test needs them", async () => {
    await withSunClawTestState(
      {
        env: {
          SUNCLAW_AGENT_DIR: "/tmp/explicit-sunclaw-agent",
        },
      },
      async (state) => {
        expect(process.env.SUNCLAW_AGENT_DIR).toBe("/tmp/explicit-sunclaw-agent");
        expect(state.env.SUNCLAW_AGENT_DIR).toBe("/tmp/explicit-sunclaw-agent");
      },
    );
  });

  it("can route agent-dir env vars to the isolated main agent store", async () => {
    await withSunClawTestState(
      {
        agentEnv: "main",
      },
      async (state) => {
        expect(process.env.SUNCLAW_AGENT_DIR).toBe(state.agentDir());
        expect(state.env.SUNCLAW_AGENT_DIR).toBe(state.agentDir());
      },
    );
  });

  it("writes scenario configs and auth profile stores", async () => {
    await withSunClawTestState(
      {
        scenario: "update-stable",
      },
      async (state) => {
        expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toEqual({
          update: {
            channel: "stable",
          },
          plugins: {},
        });

        const profilePath = await state.writeAuthProfiles({
          version: 1,
          profiles: {
            "openai:test": {
              type: "api_key",
              provider: "openai",
              key: "sk-test",
            },
          },
        });

        expect(profilePath).toBe(path.join(state.agentDir(), "auth-profiles.json"));
        const profiles = JSON.parse(await fs.readFile(profilePath, "utf8")) as {
          version?: unknown;
          profiles?: Record<string, { provider?: unknown }>;
        };
        expect(profiles.version).toBe(1);
        expect(profiles.profiles?.["openai:test"]?.provider).toBe("openai");
      },
    );
  });

  it("creates upgrade survivor fixture state", async () => {
    await withSunClawTestState(
      {
        scenario: "upgrade-survivor",
      },
      async (state) => {
        const config = JSON.parse(await fs.readFile(state.configPath, "utf8"));
        expect(config.update?.channel).toBe("stable");
        expect(config.plugins?.enabled).toBe(true);
        expect(config.plugins?.allow).toStrictEqual(["discord", "telegram", "whatsapp", "memory"]);
      },
    );
  });

  it("keeps external-service env scoped to the fixture", async () => {
    const previousPolicy = process.env.SUNCLAW_SERVICE_REPAIR_POLICY;

    await withSunClawTestState(
      {
        scenario: "external-service",
      },
      async (state) => {
        expect(process.env.SUNCLAW_SERVICE_REPAIR_POLICY).toBe("external");
        expect(state.env.SUNCLAW_SERVICE_REPAIR_POLICY).toBe("external");
      },
    );

    expect(process.env.SUNCLAW_SERVICE_REPAIR_POLICY).toBe(previousPolicy);
  });
});
