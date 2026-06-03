import { describe, expect, it } from "vitest";
import { resolveCodexAppServerForSunClawToolPolicy } from "./app-server-policy.js";
import { readCodexPluginConfig, resolveCodexAppServerRuntimeOptions } from "./config.js";

describe("Codex app-server policy", () => {
  it("keeps implicit Codex yolo approval policy when untrusted approvals are disallowed", () => {
    const appServer = resolveCodexAppServerRuntimeOptions({ env: {}, requirementsToml: null });

    const resolved = resolveCodexAppServerForSunClawToolPolicy({
      appServer,
      pluginConfig: readCodexPluginConfig({}),
      env: {},
      shouldPromote: true,
      canUseUntrustedApprovalPolicy: false,
    });

    expect(resolved.approvalPolicy).toBe("never");
  });

  it("promotes implicit yolo approval policy when SunClaw tool policy requires review", () => {
    const appServer = resolveCodexAppServerRuntimeOptions({ env: {}, requirementsToml: null });

    const resolved = resolveCodexAppServerForSunClawToolPolicy({
      appServer,
      pluginConfig: readCodexPluginConfig({}),
      env: {},
      shouldPromote: true,
      canUseUntrustedApprovalPolicy: true,
    });

    expect(resolved.approvalPolicy).toBe("untrusted");
  });

  it("preserves explicit operator app-server policy", () => {
    const appServer = resolveCodexAppServerRuntimeOptions({ env: {}, requirementsToml: null });
    const requirementsAppServer = resolveCodexAppServerRuntimeOptions({
      env: {},
      requirementsToml:
        'allowed_approval_policies = ["never"]\nallowed_sandbox_modes = ["workspace-write"]\n',
    });

    const explicitConfig = resolveCodexAppServerForSunClawToolPolicy({
      appServer,
      pluginConfig: readCodexPluginConfig({ appServer: { mode: "yolo" } }),
      env: {},
      shouldPromote: true,
      canUseUntrustedApprovalPolicy: true,
    });
    const explicitEnv = resolveCodexAppServerForSunClawToolPolicy({
      appServer,
      pluginConfig: readCodexPluginConfig({}),
      env: { SUNCLAW_CODEX_APP_SERVER_APPROVAL_POLICY: "never" },
      shouldPromote: true,
      canUseUntrustedApprovalPolicy: true,
    });
    const explicitRequirements = resolveCodexAppServerForSunClawToolPolicy({
      appServer: requirementsAppServer,
      pluginConfig: readCodexPluginConfig({}),
      env: {},
      shouldPromote: true,
      canUseUntrustedApprovalPolicy: true,
    });

    expect(explicitConfig.approvalPolicy).toBe("never");
    expect(explicitEnv.approvalPolicy).toBe("never");
    expect(explicitRequirements.approvalPolicy).toBe("never");
  });
});
