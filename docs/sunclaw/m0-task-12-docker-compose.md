# M0 Task 12 — Local smoke test via docker-compose (audit + decision)

**ECO:** [ECO-2078](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2078)
**Status:** completed
**Date:** 2026-06-03

## Decision

Keep upstream `docker-compose.yml` (root of repo) as-is. **No new
`deploy/docker/compose.yml` added.**

## Rationale

The plan prescribed a new `deploy/docker/compose.yml` modelled after a
typical web+API+DB+cache stack:

```yaml
services:
  postgres: { image: postgres:16-alpine, ... }
  redis: { image: redis:7-alpine, ... }
  gateway: { image: ghcr.io/ulvisultanov-art/sunclaw-gateway:main }
  web: { image: ghcr.io/ulvisultanov-art/sunclaw-web:main }
```

That model **does not match SunClaw's actual architecture** on two counts:

1. **SunClaw does not depend on Postgres or Redis.** It is a CLI + gateway
   coding-agent product. State lives in `~/.sunclaw/` (filesystem) and
   Convex (when remote). Adding Postgres/Redis to the smoke stack would
   bind us to dependencies the product doesn't use, making the smoke test
   prove something other than "the SunClaw image works".
2. **`sunclaw-gateway` / `sunclaw-web` are not the publish targets.**
   Upstream publishes a single multi-purpose `sunclaw:<tag>` image to
   `ghcr.io/<repo>` (see Task 11 ADR). There is no separate web/gateway
   split at the image level.

Upstream's existing root-level `docker-compose.yml` already provides the
correct smoke artifact:

| Concern      | Plan (deploy/docker/compose.yml)      | Upstream (docker-compose.yml)                                                              |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Services     | postgres + redis + gateway + web      | `sunclaw-gateway` + `sunclaw-cli`                                                          |
| Image source | wrong refs (no such tags)             | `${SUNCLAW_IMAGE:-sunclaw:local}` with `build: .` fallback                                 |
| Healthcheck  | shell `pg_isready` / `redis-cli ping` | `node -e "fetch('http://127.0.0.1:18789/healthz')..."` against the actual gateway endpoint |
| Hardening    | none                                  | `cap_drop: NET_RAW NET_ADMIN`, `security_opt: no-new-privileges:true`, `init: true`        |
| Volumes      | none                                  | host-mounted state/workspace/secret dirs with env-overridable paths                        |
| Env contract | hardcoded `DATABASE_URL` etc.         | optional `.env` import + OTEL\_\* exporter passthrough + auth profile dir                  |
| Networking   | port-mapping only                     | `extra_hosts: host.docker.internal:host-gateway` for Linux Docker Engine                   |
| CLI mode     | not addressed                         | `sunclaw-cli` service with `network_mode: service:sunclaw-gateway` for sidecar use         |

Adding a parallel `deploy/docker/compose.yml` would:

1. Lie about SunClaw's runtime topology (postgres/redis aren't in the
   product).
2. Diverge from upstream every time they edit the root compose.yml.
3. Confuse newcomers: which compose file is canonical?

## Smoke test (current, working procedure)

The acceptance criterion from the M0 plan is "compose stack comes up
green". Steps to verify locally:

```bash
# Build the image from current source (Dockerfile is at repo root).
docker compose build sunclaw-gateway

# Bring the stack up. healthcheck on sunclaw-gateway becomes healthy
# once the gateway responds 200 to /healthz on :18789.
docker compose up -d sunclaw-gateway

# Verify health.
docker compose ps             # sunclaw-gateway state should be "healthy"
docker compose logs sunclaw-gateway --tail 20

# Optional: exec into the CLI sidecar.
docker compose run --rm sunclaw-cli sunclaw --version

# Tear down.
docker compose down
```

This proves the same property the plan's compose-up would have: the
release image starts cleanly with no env vars, exposes a healthcheck
endpoint, and serves a recognizable response on the published port.

## Forward path

When the SunClaw stack genuinely grows server-side dependencies (Convex
self-host, OTel collector, or a future webhook receiver), add them to the
existing root `docker-compose.yml` rather than spinning up a sibling
file. Upstream-respecting precedent applies: edit in place, then submit
the additions back to OpenClaw via PR when the change is generic.

## Precedent

Same pattern applied in Tasks 5 / 6 / 7 / 8 / 9 / 10 / 11. See
`m0-task-11-docker-workflow.md` for the most directly analogous
audit (the docker-release workflow).
