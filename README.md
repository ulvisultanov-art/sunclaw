# SunClaw

> Self-hosted, multi-tenant personal AI agent platform for the SUN ecosystem.
> Forked from [OpenClaw](https://github.com/openclaw/openclaw) (MIT), rebranded
> and re-targeted for `*.complex.az` deployment.

[![SunClaw Fork Invariants](https://github.com/ulvisultanov-art/sunclaw/actions/workflows/sunclaw-fork.yml/badge.svg)](https://github.com/ulvisultanov-art/sunclaw/actions/workflows/sunclaw-fork.yml)
[![SunClaw Security CI](https://github.com/ulvisultanov-art/sunclaw/actions/workflows/sunclaw-security.yml/badge.svg)](https://github.com/ulvisultanov-art/sunclaw/actions/workflows/sunclaw-security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Status

Pre-MVP, M0 bootstrap phase. Tracking via
[ECO-2077](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2077)
(programme) and
[ECO-2078](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2078)
(M0 bootstrap milestone).

## What this is

SunClaw is the SUN ecosystem fork of OpenClaw, a personal AI agent platform.
It runs on `*.complex.az` infrastructure (Hetzner AX162-R / Talos / Cilium /
ArgoCD) with Cloudflare Access JWT authentication restricted to corporate
identity.

For the full upstream feature description (channels, skills, capabilities)
see the mirror of upstream's README at
[`docs/sunclaw/README-upstream-mirror.md`](docs/sunclaw/README-upstream-mirror.md).
That file preserves OpenClaw's product narrative after rebranding.

## Quick start (dev)

Requirements: Node 22.19+, pnpm 11.2+ (via corepack), Docker.

```bash
# Install workspace dependencies (also installs git hooks).
pnpm install

# Run baseline checks (matches upstream's ci.yml).
pnpm tsgo:core      # typecheck
pnpm oxlint .       # lint
pnpm format:check   # format diff

# Smoke test via the bundled compose stack.
docker compose build sunclaw-gateway
docker compose up -d sunclaw-gateway
docker compose ps   # sunclaw-gateway should reach "healthy"
```

## Architecture and decisions

The M0 bootstrap deviates from the original implementation plan in several
places where upstream OpenClaw already provides a stronger primitive. Each
deviation is captured as an ADR under [`docs/sunclaw/`](docs/sunclaw/):

| ADR                                                                               | Topic                                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`m0-task-08-typescript-strict.md`](docs/sunclaw/m0-task-08-typescript-strict.md) | Kept upstream's tsconfig (already strict)                             |
| [`m0-task-11-docker-workflow.md`](docs/sunclaw/m0-task-11-docker-workflow.md)     | Kept upstream's `docker-release.yml` (SBOM + provenance via BuildKit) |
| [`m0-task-12-docker-compose.md`](docs/sunclaw/m0-task-12-docker-compose.md)       | Kept upstream's `docker-compose.yml` (no Postgres/Redis layer)        |

Full programme plan lives in the sister `sunecosystem` repo at
[`docs/superpowers/plans/2026-06-03-sunclaw-m0-bootstrap.md`](https://github.com/ulvisultanov-art/sunecosystem/blob/main/docs/superpowers/plans/2026-06-03-sunclaw-m0-bootstrap.md).

## License

MIT. See [`LICENSE`](LICENSE) for the full text (both upstream's and
SunClaw's copyright lines) and [`NOTICE`](NOTICE) for fork attribution.

## Upstream sync

See [`UPSTREAM.md`](UPSTREAM.md) for the pinned upstream SHA and the merge
helper script (`scripts/upstream-merge.sh`, added in M0 Task 16). Sync
cadence: biweekly while M0-M2 are active, monthly after MVP cut.
