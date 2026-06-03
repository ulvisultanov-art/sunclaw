# M3 prep — per-identity bearer derivation from Access JWT

> **Status:** Notes only. Not implemented. M3 picks this up.
> **Author:** Claude Opus 4.7 (M2 closeout)
> **Date:** 2026-06-03
> **Tracking:** ECO-2088 closeout note — M3 will get its own ECO.

## Goal

Replace the shared `bearer` token on `sunclaw.complex.az` (M1 path)
with a per-identity SunClaw-issued bearer derived from the
Cloudflare Access JWT `email` claim. This makes token leaks
identity-scoped instead of deployment-scoped.

## What M2 left in place

- `cloudflare-access` auth mode verifies the JWT and populates
  `AuthorizedGatewayHttpRequest.identity = { kind: "email", email, sub }`.
- `resolveTrustedHttpOperatorScopes` already accepts the identity
  and returns operator scopes.

## What M3 must add

1. A `/v1/auth/exchange` endpoint on ClawHub that:
   - Verifies the inbound Cf-Access-Jwt-Assertion (already
     handled by the auth middleware, no extra code).
   - Mints a SunClaw-internal JWT (HS256, signed with a
     per-deployment secret in Vault at
     `secret/complex-sunclaw/internal-jwt-key`).
   - Encodes `{ sub: email, scopes, exp: now+24h, jti }`.
   - Returns `{ token: "...", expiresAt: "..." }`.

2. A new auth mode `"sunclaw-bearer"` on the public gateway that:
   - Verifies the HS256 signature with the same Vault secret.
   - Checks `exp` and `jti` (in-memory bloom + Redis backstop for revocation).
   - Populates `identity = { kind: "email", email, sub }`.

3. A revocation endpoint `/v1/auth/revoke` (ClawHub-side,
   Access-gated) that adds the `jti` to the Redis revocation list
   with TTL = exp - now.

4. ClawHub UI — a token management page where each user sees
   their own active bearer tokens, can revoke them, and can mint
   a new one (for CLI / scripting / channel-adapter
   consumption).

## Why the bearer is HS256 not RS256

The minting and verifying parties are the same trust domain (the
sunclaw cluster). HS256 avoids the JWKS distribution problem
inside the cluster, and the secret never leaves Vault. Switch to
RS256 only when a non-cluster verifier (e.g. a partner) needs to
validate tokens without contacting us — not the M3 scope.

## Compatibility window

M3 should ship both `token` (shared, M1) and `sunclaw-bearer`
(per-identity, M3) on the public gateway simultaneously,
configured as `gateway.auth.mode = "sunclaw-bearer"` with a
`gateway.auth.legacyBearer = ENV{LEGACY_BEARER}` fallback. M4
(channel adapters) cuts the legacy bearer.

## References

- ADR-0012 § "Out of scope for M2" row M3
- ADR-0011 § "Out of scope for M1" row M2 (now closed by M2)
- This M2 plan, Task 4 (`identity` population)
