/**
 * Cloudflare Access JWT verifier.
 *
 * Validates a JWT from the `Cf-Access-Jwt-Assertion` header against
 * Cloudflare's per-team JWKS endpoint, with three layers of defence:
 *
 *   1. Signature — JWKS lookup by `kid`, verified with `jose`.
 *   2. AUD pinning — `aud` claim must contain the per-Application tag.
 *   3. Email domain — `email` claim's domain must appear in the
 *      caller-supplied allowlist.
 *
 * Returns a tagged result so callers cannot accidentally treat a failure
 * as a success.
 */

import { jwtVerify, createLocalJWKSet, type JWTPayload } from "jose";
import { fetchAndCacheJwks } from "./jwks-cache.js";

export interface VerifyParams {
  readonly token: string;
  readonly teamDomain: string;
  readonly aud: string;
  readonly allowedEmailDomains: ReadonlyArray<string>;
}

export type VerifyResult =
  | {
      readonly ok: true;
      readonly email: string;
      readonly sub: string;
      readonly payload: JWTPayload;
    }
  | { readonly ok: false; readonly reason: string };

export async function verifyAccessJwt(params: VerifyParams): Promise<VerifyResult> {
  const { token, teamDomain, aud, allowedEmailDomains } = params;

  let payload: JWTPayload;
  try {
    const jwks = await fetchAndCacheJwks({ teamDomain });
    const keySet = createLocalJWKSet({ keys: [...jwks.keys] });
    const verified = await jwtVerify(token, keySet, {
      issuer: `https://${teamDomain}.cloudflareaccess.com`,
      audience: aud,
    });
    payload = verified.payload;
  } catch (err) {
    return {
      ok: false,
      reason: `signature/aud/exp verification failed: ${(err as Error).message}`,
    };
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  if (email === "") {
    return { ok: false, reason: "email claim missing or empty" };
  }
  const domain = email.includes("@") ? email.slice(email.lastIndexOf("@") + 1).toLowerCase() : "";
  const allow = new Set(allowedEmailDomains.map((d) => d.toLowerCase()));
  if (!allow.has(domain)) {
    return { ok: false, reason: `email domain ${domain} not in allowlist` };
  }

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  return { ok: true, email, sub, payload };
}
