import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { _resetJwksCacheForTests } from "./jwks-cache";
import { verifyAccessJwt } from "./verify";

describe("verifyAccessJwt", () => {
  const teamDomain = "complex";
  const aud = "aud-tag-abc123";

  beforeEach(() => {
    _resetJwksCacheForTests();
    vi.restoreAllMocks();
  });

  async function mintToken(payload: Record<string, unknown>, opts: { aud?: string } = {}) {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    const kid = "test-kid-1";
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

  it("accepts a well-formed token with matching AUD and email domain", async () => {
    const token = await mintToken({ email: "ulvi@complex.az", sub: "user-1" });
    const result = await verifyAccessJwt({
      token,
      teamDomain,
      aud,
      allowedEmailDomains: ["complex.az"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("ulvi@complex.az");
      expect(result.sub).toBe("user-1");
    }
  });

  it("rejects a token whose AUD does not match", async () => {
    const token = await mintToken({ email: "u@complex.az" }, { aud: "wrong-aud" });
    const result = await verifyAccessJwt({
      token,
      teamDomain,
      aud,
      allowedEmailDomains: ["complex.az"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/aud/i);
  });

  it("rejects a token whose email domain is not allowed", async () => {
    const token = await mintToken({ email: "evil@attacker.tld" });
    const result = await verifyAccessJwt({
      token,
      teamDomain,
      aud,
      allowedEmailDomains: ["complex.az"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/email/i);
  });

  it("rejects a token with no email claim", async () => {
    const token = await mintToken({ sub: "no-email" });
    const result = await verifyAccessJwt({
      token,
      teamDomain,
      aud,
      allowedEmailDomains: ["complex.az"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/email/i);
  });
});
