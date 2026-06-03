# SunClaw M2 — Cloudflare Access JWT for ClawHub

- **Status:** Accepted 2026-06-03
- **Milestone:** M2 under programme ECO-2077
- **PM task:** [ECO-2088](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2088)
- **Companion ADR (sunecosystem):** `docs/architecture/adrs/ADR-0012-sunclaw-cloudflare-access-jwt.md`
- **Plan:** `docs/superpowers/plans/2026-06-03-sunclaw-m2-cloudflare-access.md` (in `sunecosystem`)

## Auth mode shape

```ts
gateway.auth = {
  mode: "cloudflare-access",
  cloudflareAccess: {
    teamDomain: "complex",
    aud: "<per-Application AUD from Zero Trust dashboard>",
    allowedEmailDomains: ["complex.az"],
  },
};
```

On every request, the dispatcher:

1. Reads `Cf-Access-Jwt-Assertion`. Missing → 401 with `WWW-Authenticate: CF-Access-Required`.
2. Fetches the per-team JWKS (cached 6h, refetched on `kid` miss).
3. Verifies signature + issuer + `aud` + `exp`/`nbf` via `jose`.
4. Extracts `email` claim. Domain not in `allowedEmailDomains` → 403.
5. Populates `GatewayAuthResult` so downstream `resolveTrustedHttpOperatorScopes` treats the identity as per-user (not shared-secret). The verified JWT `sub` claim is surfaced as `subject` for stable identity tracking.

## Source ↔ image ↔ deploy tag mapping

| Concept                     | Value                                        | Repo                       |
| --------------------------- | -------------------------------------------- | -------------------------- |
| Fork source tag (this repo) | `sunclaw-v0.2.1`                             | `sunclaw`                  |
| Image tag                   | `registry.complex.az/sunclaw:sunclaw-v0.2.1` | (registry)                 |
| K8s deploy cut (CHANGELOG)  | `0.2.1`                                      | `sunclaw` (this file)      |
| ArgoCD pinned image.tag     | `sunclaw-v0.2.1`                             | `sunecosystem` Application |

## Security posture summary (M2)

| Concern                                       | M2 posture                                                     |
| --------------------------------------------- | -------------------------------------------------------------- |
| ClawHub gated to `*.complex.az` IdP           | ✅ Cloudflare Access policy + Google IdP                       |
| In-pod JWT signature verification             | ✅ JWKS-by-kid via jose                                        |
| AUD pinning to specific Application           | ✅ AUD claim verified                                          |
| Email domain allowlist                        | ✅ caller-supplied allowlist                                   |
| JWKS rotation tolerance                       | ✅ refetch on `kid` miss; 6h TTL otherwise                     |
| Startup config validation                     | ✅ assertGatewayAuthConfigured fail-fasts missing/empty fields |
| Audit log of every verification               | ❌ deferred to M7                                              |
| Per-identity bearer tokens for public gateway | ❌ deferred to M3                                              |
