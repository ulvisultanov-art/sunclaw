import { describe, expect, it } from "vitest";
import type { SunClawConfig } from "../config/config.js";
import {
  collectGatewayCloudflareAccessFindings,
  collectGatewayHttpNoAuthFindings,
  collectGatewayHttpSessionKeyOverrideFindings,
} from "./audit-extra.sync.js";

function requireFinding(
  findings: Array<{ checkId: string; detail: string; severity?: string }>,
  checkId: string,
) {
  const finding = findings.find((entry) => entry.checkId === checkId);
  if (!finding) {
    throw new Error(`Expected ${checkId} finding`);
  }
  return finding;
}

describe("security audit gateway HTTP auth findings", () => {
  it.each([
    {
      name: "scores loopback gateway HTTP no-auth as warn",
      cfg: {
        gateway: {
          bind: "loopback",
          auth: { mode: "none" },
          http: { endpoints: { chatCompletions: { enabled: true } } },
        },
      } satisfies SunClawConfig,
      expectedFinding: { checkId: "gateway.http.no_auth", severity: "warn" as const },
      detailIncludes: ["/tools/invoke", "/v1/chat/completions"],
      env: {} as NodeJS.ProcessEnv,
    },
    {
      name: "scores remote gateway HTTP no-auth as critical",
      cfg: {
        gateway: {
          bind: "lan",
          auth: { mode: "none" },
          http: { endpoints: { responses: { enabled: true } } },
        },
        plugins: { entries: { "admin-http-rpc": { enabled: true } } },
      } satisfies SunClawConfig,
      expectedFinding: { checkId: "gateway.http.no_auth", severity: "critical" as const },
      detailIncludes: ["/api/v1/admin/rpc"],
      env: {} as NodeJS.ProcessEnv,
    },
    {
      name: "does not report gateway.http.no_auth when auth mode is token",
      cfg: {
        gateway: {
          bind: "loopback",
          auth: { mode: "token", token: "secret" },
          http: {
            endpoints: {
              chatCompletions: { enabled: true },
              responses: { enabled: true },
            },
          },
        },
      } satisfies SunClawConfig,
      expectedNoFinding: "gateway.http.no_auth",
      env: {} as NodeJS.ProcessEnv,
    },
    {
      name: "does not report gateway.http.no_auth with runtime password auth override",
      cfg: {
        gateway: {
          bind: "loopback",
          auth: { mode: "none" },
          http: {
            endpoints: {
              chatCompletions: { enabled: true },
            },
          },
        },
      } satisfies SunClawConfig,
      expectedNoFinding: "gateway.http.no_auth",
      env: {} as NodeJS.ProcessEnv,
      gatewayAuthOverride: {
        mode: "password" as const,
        password: "runtime-gateway-password-1234567890", // pragma: allowlist secret
      },
    },
    {
      name: "reports gateway.http.no_auth when runtime password mode lacks a password",
      cfg: {
        gateway: {
          bind: "loopback",
          auth: { mode: "none" },
          http: {
            endpoints: {
              chatCompletions: { enabled: true },
            },
          },
        },
      } satisfies SunClawConfig,
      expectedFinding: { checkId: "gateway.http.no_auth", severity: "warn" as const },
      env: {} as NodeJS.ProcessEnv,
      gatewayAuthOverride: {
        mode: "password" as const,
      },
    },
    {
      name: "reports HTTP API session-key override surfaces when enabled",
      cfg: {
        gateway: {
          http: {
            endpoints: {
              chatCompletions: { enabled: true },
              responses: { enabled: true },
            },
          },
        },
      } satisfies SunClawConfig,
      expectedFinding: {
        checkId: "gateway.http.session_key_override_enabled",
        severity: "info" as const,
      },
    },
  ])(
    "$name",
    ({ cfg, expectedFinding, expectedNoFinding, detailIncludes, env, gatewayAuthOverride }) => {
      const findings = [
        ...collectGatewayHttpNoAuthFindings(cfg, env ?? process.env, { gatewayAuthOverride }),
        ...collectGatewayHttpSessionKeyOverrideFindings(cfg),
      ];

      if (expectedFinding) {
        const finding = requireFinding(findings, expectedFinding.checkId);
        expect(finding.severity).toBe(expectedFinding.severity);
        if (detailIncludes) {
          for (const text of detailIncludes) {
            expect(finding.detail, `${expectedFinding.checkId}:${text}`).toContain(text);
          }
        }
      }
      if (expectedNoFinding) {
        expect(findings.map((entry) => entry.checkId)).not.toContain(expectedNoFinding);
      }
    },
  );
});

describe("security audit gateway cloudflare-access findings", () => {
  it("flags misconfig when mode is cloudflare-access but teamDomain/aud are missing", () => {
    const cfg = {
      gateway: {
        bind: "lan",
        auth: {
          mode: "cloudflare-access",
          // cloudflareAccess block intentionally missing
        },
      },
    } satisfies SunClawConfig;
    const findings = collectGatewayCloudflareAccessFindings(cfg);
    const finding = requireFinding(findings, "gateway.http.cloudflare_access_misconfig");
    expect(finding.severity).toBe("critical");
    expect(finding.detail).toContain("teamDomain");
    expect(finding.detail).toContain("aud");
    // No allowlist finding when block is entirely missing (the misconfig is the precondition)
    expect(findings.map((entry) => entry.checkId)).not.toContain(
      "gateway.http.cloudflare_access_no_email_allowlist",
    );
  });

  it("flags empty email allowlist as critical when teamDomain/aud are otherwise present", () => {
    const cfg = {
      gateway: {
        bind: "lan",
        auth: {
          mode: "cloudflare-access",
          cloudflareAccess: {
            teamDomain: "complex",
            aud: "abc123",
            allowedEmailDomains: [],
          },
        },
      },
    } satisfies SunClawConfig;
    const findings = collectGatewayCloudflareAccessFindings(cfg);
    const finding = requireFinding(findings, "gateway.http.cloudflare_access_no_email_allowlist");
    expect(finding.severity).toBe("critical");
    expect(finding.detail).toContain("allowedEmailDomains");
    // Misconfig finding should NOT fire when teamDomain + aud are present
    expect(findings.map((entry) => entry.checkId)).not.toContain(
      "gateway.http.cloudflare_access_misconfig",
    );
  });

  it("treats whitespace-only allowedEmailDomains entries as empty", () => {
    const cfg = {
      gateway: {
        bind: "lan",
        auth: {
          mode: "cloudflare-access",
          cloudflareAccess: {
            teamDomain: "complex",
            aud: "abc123",
            allowedEmailDomains: ["", "  "],
          },
        },
      },
    } satisfies SunClawConfig;
    const findings = collectGatewayCloudflareAccessFindings(cfg);
    expect(findings.map((f) => f.checkId)).toContain(
      "gateway.http.cloudflare_access_no_email_allowlist",
    );
  });

  it("is silent on a well-formed cloudflare-access config", () => {
    const cfg = {
      gateway: {
        bind: "lan",
        auth: {
          mode: "cloudflare-access",
          cloudflareAccess: {
            teamDomain: "complex",
            aud: "abc123",
            allowedEmailDomains: ["complex.az"],
          },
        },
      },
    } satisfies SunClawConfig;
    const findings = collectGatewayCloudflareAccessFindings(cfg);
    const cloudflareAccessFindings = findings.filter((entry) =>
      entry.checkId.startsWith("gateway.http.cloudflare_access_"),
    );
    expect(cloudflareAccessFindings).toEqual([]);
  });

  it("does not run when mode is something other than cloudflare-access", () => {
    const cfg = {
      gateway: {
        bind: "loopback",
        auth: { mode: "token", token: "secret" },
      },
    } satisfies SunClawConfig;
    const findings = collectGatewayCloudflareAccessFindings(cfg);
    expect(findings).toEqual([]);
  });
});
