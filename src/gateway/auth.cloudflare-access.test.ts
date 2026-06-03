/**
 * Cloudflare Access dispatcher integration tests.
 *
 * Covers Task 4 of the M2 milestone (ECO-2088): the cloudflare-access branch
 * inside authorizeGatewayConnectCore. The verifier itself has its own
 * exhaustive test suite under src/gateway/cloudflare-access/verify.test.ts;
 * here we only assert that the dispatcher reads the Cf-Access-Jwt-Assertion
 * header, calls verifyAccessJwt with the right parameters, and propagates
 * the result back through the existing GatewayAuthResult shape so that
 * resolveTrustedHttpOperatorScopes treats the verified email as a
 * per-identity surface (not a shared-secret bearer surface).
 */

import type { IncomingMessage } from "node:http";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GatewayAuthConfig, GatewayCloudflareAccessConfig } from "../config/types.gateway.js";
import { resolveGatewayAuth, type ResolvedGatewayAuth } from "./auth-resolve.js";
import { _resetJwksCacheForTests } from "./cloudflare-access/jwks-cache.js";
import { checkGatewayHttpRequestAuth } from "./http-auth-utils.js";

const teamDomain = "complex";
const aud = "aud-tag-abc123";

function createReq(
  overrides: { headers?: Record<string, string>; remoteAddr?: string } = {},
): IncomingMessage {
  return {
    socket: { remoteAddress: overrides.remoteAddr ?? "127.0.0.1" },
    headers: overrides.headers ?? {},
  } as never;
}

async function mintAccessJwt(payload: Record<string, unknown>, opts: { aud?: string } = {}) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const kid = "test-kid-dispatcher";
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ keys: [{ ...jwk, kid, alg: "RS256", use: "sig" }] }), {
      status: 200,
    }),
  );
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(`https://${teamDomain}.cloudflareaccess.com`)
    .setAudience(opts.aud ?? aud)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

function makeAuth(
  overrides: Partial<ResolvedGatewayAuth> = {},
  cfConfig?: GatewayCloudflareAccessConfig,
): ResolvedGatewayAuth {
  const baseCfConfig: GatewayCloudflareAccessConfig = cfConfig ?? {
    teamDomain,
    aud,
    allowedEmailDomains: ["complex.az"],
  };
  return {
    mode: "cloudflare-access",
    allowTailscale: false,
    cloudflareAccess: baseCfConfig,
    ...overrides,
  };
}

describe("cloudflare-access dispatcher", () => {
  beforeEach(() => {
    _resetJwksCacheForTests();
    vi.restoreAllMocks();
  });

  it("rejects with 401-shaped result and WWW-Authenticate when Cf-Access-Jwt-Assertion is missing", async () => {
    const result = await checkGatewayHttpRequestAuth({
      req: createReq(),
      auth: makeAuth(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.authResult.method).toBe("cloudflare-access");
    expect(result.authResult.reason).toBe("cf_access_jwt_header_missing");
    expect(result.authResult.wwwAuthenticate).toBe("CF-Access-Required");
  });

  it("rejects with config-missing reason when cloudflare-access mode is selected but config block is absent", async () => {
    const result = await checkGatewayHttpRequestAuth({
      req: createReq({ headers: { "cf-access-jwt-assertion": "any.token.value" } }),
      auth: makeAuth({ cloudflareAccess: undefined }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.authResult.method).toBe("cloudflare-access");
    expect(result.authResult.reason).toBe("cloudflare_access_config_missing");
  });

  it("verifies a well-formed token and exposes method=cloudflare-access with trustDeclaredOperatorScopes=true", async () => {
    const token = await mintAccessJwt({ email: "ulvi@complex.az", sub: "u-1" });
    const result = await checkGatewayHttpRequestAuth({
      req: createReq({ headers: { "cf-access-jwt-assertion": token } }),
      auth: makeAuth(),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.requestAuth.authMethod).toBe("cloudflare-access");
    expect(result.requestAuth.trustDeclaredOperatorScopes).toBe(true);
  });

  it("rejects when the verifier fails (email domain not in allowlist)", async () => {
    const token = await mintAccessJwt({ email: "rando@evil.tld", sub: "u-2" });
    const result = await checkGatewayHttpRequestAuth({
      req: createReq({ headers: { "cf-access-jwt-assertion": token } }),
      auth: makeAuth(undefined, {
        teamDomain,
        aud,
        allowedEmailDomains: ["complex.az"],
      }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.authResult.method).toBe("cloudflare-access");
    expect(result.authResult.reason ?? "").toMatch(/^cloudflare_access_verification_failed:/);
  });

  it("rejects when the verifier fails (audience mismatch)", async () => {
    const token = await mintAccessJwt(
      { email: "ulvi@complex.az", sub: "u-3" },
      { aud: "some-other-aud" },
    );
    const result = await checkGatewayHttpRequestAuth({
      req: createReq({ headers: { "cf-access-jwt-assertion": token } }),
      auth: makeAuth(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.authResult.method).toBe("cloudflare-access");
    expect(result.authResult.reason ?? "").toMatch(/^cloudflare_access_verification_failed:/);
  });

  it("resolveGatewayAuth threads cloudflareAccess from config into the resolved auth", () => {
    const authConfig: GatewayAuthConfig = {
      mode: "cloudflare-access",
      cloudflareAccess: {
        teamDomain: "another-team",
        aud: "another-aud",
        allowedEmailDomains: ["example.com"],
      },
    };
    const resolved = resolveGatewayAuth({ authConfig });
    expect(resolved.mode).toBe("cloudflare-access");
    expect(resolved.cloudflareAccess?.teamDomain).toBe("another-team");
    expect(resolved.cloudflareAccess?.aud).toBe("another-aud");
    expect(resolved.cloudflareAccess?.allowedEmailDomains).toEqual(["example.com"]);
  });

  it("resolveGatewayAuth respects authOverride.cloudflareAccess overlay", () => {
    const authConfig: GatewayAuthConfig = {
      mode: "cloudflare-access",
      cloudflareAccess: {
        teamDomain: "base-team",
        aud: "base-aud",
        allowedEmailDomains: ["base.example"],
      },
    };
    const authOverride: GatewayAuthConfig = {
      cloudflareAccess: {
        teamDomain: "override-team",
        aud: "override-aud",
        allowedEmailDomains: ["override.example"],
      },
    };
    const resolved = resolveGatewayAuth({ authConfig, authOverride });
    expect(resolved.cloudflareAccess?.teamDomain).toBe("override-team");
    expect(resolved.cloudflareAccess?.allowedEmailDomains).toEqual(["override.example"]);
  });
});
