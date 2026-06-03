import { afterEach, describe, expect, it } from "vitest";
import type { SunClawConfig } from "../config/config.js";
import { setEmbeddedMode } from "../infra/embedded-mode.js";
import { isToolWrappedWithBeforeToolCallHook } from "./agent-tools.before-tool-call.js";
import { createSunClawTools } from "./sunclaw-tools.js";
import {
  isUpdatePlanToolEnabledForSunClawTools,
  shouldIncludeUpdatePlanToolForSunClawTools,
} from "./sunclaw-tools.registration.js";
import { createUpdatePlanTool } from "./tools/update-plan-tool.js";

type UpdatePlanGatingParams = Parameters<typeof isUpdatePlanToolEnabledForSunClawTools>[0];
type CreateSunClawToolsOptions = NonNullable<Parameters<typeof createSunClawTools>[0]>;

function expectUpdatePlanEnabled(params: UpdatePlanGatingParams, expected: boolean): void {
  expect(isUpdatePlanToolEnabledForSunClawTools(params)).toBe(expected);
}

function toolNames(tools: ReturnType<typeof createSunClawTools>): string[] {
  return tools.map((tool) => tool.name);
}

function createFastToolNames(options: CreateSunClawToolsOptions): string[] {
  return toolNames(
    createSunClawTools({
      disableMessageTool: true,
      disablePluginTools: true,
      wrapBeforeToolCallHook: false,
      ...options,
    }),
  );
}

function expectToolNamed(
  tools: ReturnType<typeof createSunClawTools>,
  name: string,
): ReturnType<typeof createSunClawTools>[number] {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) {
    throw new Error(`Expected tool ${name} to be registered`);
  }
  return tool;
}

function openAiGpt5Params(
  config: SunClawConfig,
  overrides: Partial<UpdatePlanGatingParams> = {},
): UpdatePlanGatingParams {
  const params: UpdatePlanGatingParams = {
    config,
    agentSessionKey: "agent:main:main",
    modelProvider: "openai",
    modelId: "gpt-5.4",
    ...overrides,
  };
  if ("agentId" in overrides && !("agentSessionKey" in overrides)) {
    delete params.agentSessionKey;
  }
  return params;
}

describe("sunclaw-tools update_plan gating", () => {
  afterEach(() => {
    setEmbeddedMode(false);
  });

  it("keeps update_plan disabled by default", () => {
    expectUpdatePlanEnabled({ config: {} as SunClawConfig }, false);
  });

  it("does not expose update_plan from default tool construction", () => {
    const defaultTools = createFastToolNames({
      config: {} as SunClawConfig,
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    });
    const emptyAllowlistParams = {
      config: {} as SunClawConfig,
      pluginToolAllowlist: [],
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    };

    expect(defaultTools).not.toContain("update_plan");
    expect(shouldIncludeUpdatePlanToolForSunClawTools(emptyAllowlistParams)).toBe(false);
  });

  it("wraps constructed tools with before-tool-call hooks by default", () => {
    const tools = createSunClawTools({
      config: {} as SunClawConfig,
      disablePluginTools: true,
    });
    const unwrappedTools = createSunClawTools({
      config: {} as SunClawConfig,
      disablePluginTools: true,
      wrapBeforeToolCallHook: false,
    });

    expect(isToolWrappedWithBeforeToolCallHook(expectToolNamed(tools, "sessions_list"))).toBe(true);
    expect(
      isToolWrappedWithBeforeToolCallHook(expectToolNamed(unwrappedTools, "sessions_list")),
    ).toBe(false);
  });

  it("keeps message tool in embedded message-tool-only completions", () => {
    setEmbeddedMode(true);
    const tools = createSunClawTools({
      config: {} as SunClawConfig,
      disablePluginTools: true,
      wrapBeforeToolCallHook: false,
      sourceReplyDeliveryMode: "message_tool_only",
    });

    expect(toolNames(tools)).toContain("message");
  });

  it("requires explicit transcripts enablement before registering the transcripts tool", () => {
    const defaultTools = createFastToolNames({
      config: {} as SunClawConfig,
    });
    const enabledTools = createFastToolNames({
      config: { transcripts: { enabled: true } } as SunClawConfig,
    });

    expect(defaultTools).not.toContain("transcripts");
    expect(enabledTools).toContain("transcripts");
  });

  it("keeps explicitly allowed message tool in embedded completions", () => {
    setEmbeddedMode(true);
    const fromRuntimeAllowlist = createSunClawTools({
      config: {} as SunClawConfig,
      disablePluginTools: true,
      pluginToolAllowlist: ["message"],
      wrapBeforeToolCallHook: false,
    });
    const fromGlobalAlsoAllow = createSunClawTools({
      config: { tools: { profile: "minimal", alsoAllow: ["message"] } } as SunClawConfig,
      disablePluginTools: true,
      wrapBeforeToolCallHook: false,
    });
    const denied = createSunClawTools({
      config: {} as SunClawConfig,
      disablePluginTools: true,
      pluginToolAllowlist: ["message"],
      pluginToolDenylist: ["message"],
      wrapBeforeToolCallHook: false,
    });

    expect(toolNames(fromRuntimeAllowlist)).toContain("message");
    expect(toolNames(fromGlobalAlsoAllow)).toContain("message");
    expect(toolNames(denied)).not.toContain("message");
  });

  it("keeps subagent spawn available for trusted embedded gateway-bound runs", () => {
    setEmbeddedMode(true);
    const defaultTools = createFastToolNames({
      config: {} as SunClawConfig,
    });
    const gatewayBoundTools = createFastToolNames({
      config: {} as SunClawConfig,
      allowGatewaySubagentBinding: true,
    });

    expect(defaultTools).not.toContain("sessions_spawn");
    expect(defaultTools).not.toContain("sessions_send");
    expect(gatewayBoundTools).toContain("sessions_spawn");
    expect(gatewayBoundTools).not.toContain("sessions_send");
  });

  it("registers update_plan when explicitly enabled", () => {
    const config = {
      tools: {
        experimental: {
          planTool: true,
        },
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled({ config }, true);
    expect(createUpdatePlanTool().displaySummary).toBe("Track short work plan.");
  });

  it("registers update_plan when the runtime allowlist explicitly requests it", () => {
    const tools = createFastToolNames({
      config: {} as SunClawConfig,
      pluginToolAllowlist: ["update_plan"],
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    });

    expect(tools).toContain("update_plan");
  });

  it("includes update_plan when a config allowlist group includes it", () => {
    const includeUpdatePlan = shouldIncludeUpdatePlanToolForSunClawTools({
      config: { tools: { allow: ["group:agents"] } } as SunClawConfig,
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    });

    expect(includeUpdatePlan).toBe(true);
  });

  it("includes update_plan when a runtime allowlist group includes it", () => {
    const includeUpdatePlan = shouldIncludeUpdatePlanToolForSunClawTools({
      config: {} as SunClawConfig,
      pluginToolAllowlist: ["group:agents"],
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    });

    expect(includeUpdatePlan).toBe(true);
  });

  it("respects deny policy for grouped allowlists", () => {
    const includeUpdatePlan = shouldIncludeUpdatePlanToolForSunClawTools({
      config: {} as SunClawConfig,
      pluginToolAllowlist: ["group:agents"],
      pluginToolDenylist: ["update_plan"],
      modelProvider: "anthropic",
      modelId: "claude-sonnet-4-6",
    });

    expect(includeUpdatePlan).toBe(false);
  });

  it("auto-enables update_plan for unconfigured GPT-5 openai runs", () => {
    // Criterion 1 of the GPT-5.4 parity gate ("no stalls after planning") is
    // universal, not opt-in. Unspecified executionContract on a supported
    // provider/model auto-activates strict-agentic so unconfigured installs
    // get the same behavior as explicit opt-in. Explicit "default" still
    // opts out (see "respects explicit default contract opt-out" below).
    const cfg = {
      agents: {
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg), true);
  });

  it("respects explicit default contract opt-out on GPT-5 runs", () => {
    // Users who explicitly set executionContract: "default" are saying they
    // want the old pre-parity-program behavior. Honor that opt-out.
    const cfg = {
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "default",
          },
        },
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg), false);
  });

  it("does not auto-enable update_plan for non-openai providers even when unconfigured", () => {
    const cfg = {
      agents: {
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(
      openAiGpt5Params(cfg, { modelProvider: "anthropic", modelId: "claude-sonnet-4-6" }),
      false,
    );
    expectUpdatePlanEnabled(openAiGpt5Params(cfg, { modelId: "gpt-4.1" }), false);
  });

  it("auto-enables update_plan for strict-agentic GPT-5 agents", () => {
    const cfg = {
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "strict-agentic",
          },
        },
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg), true);
  });

  it("does not auto-enable update_plan for unsupported providers or models", () => {
    const cfg = {
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "strict-agentic",
          },
        },
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(
      openAiGpt5Params(cfg, { modelProvider: "anthropic", modelId: "claude-sonnet-4-6" }),
      false,
    );
    expectUpdatePlanEnabled(openAiGpt5Params(cfg, { modelId: "gpt-4.1" }), false);
  });

  it("lets explicit planTool false override strict-agentic auto-enable", () => {
    const cfg = {
      tools: {
        experimental: {
          planTool: false,
        },
      },
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "strict-agentic",
          },
        },
        list: [{ id: "main" }],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg), false);
  });

  it("resolves strict-agentic gating from explicit agentId when no session key is available", () => {
    const cfg = {
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "default",
          },
        },
        list: [
          { id: "main" },
          {
            id: "research",
            embeddedAgent: {
              executionContract: "strict-agentic",
            },
          },
        ],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg, { agentId: "research" }), true);
  });

  it("applies per-agent overrides without leaking the contract to other agents", () => {
    const cfg = {
      agents: {
        defaults: {
          embeddedAgent: {
            executionContract: "strict-agentic",
          },
        },
        list: [
          {
            id: "main",
            embeddedAgent: {
              executionContract: "default",
            },
          },
          {
            id: "research",
          },
        ],
      },
    } as SunClawConfig;

    expectUpdatePlanEnabled(openAiGpt5Params(cfg, { agentId: "main" }), false);
    expectUpdatePlanEnabled(openAiGpt5Params(cfg, { agentId: "research" }), true);
  });
});
