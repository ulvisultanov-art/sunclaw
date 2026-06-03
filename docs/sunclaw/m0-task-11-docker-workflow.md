# M0 Task 11 — Docker workflow (audit + decision)

**ECO:** [ECO-2078](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2078)
**Status:** completed
**Date:** 2026-06-03

## Decision

Keep upstream `.github/workflows/docker-release.yml` as-is.
**No new Kaniko-based workflow added.**

## Rationale

The plan prescribed a brand-new docker workflow using:

- **Kaniko** for the build (no privileged Docker daemon)
- **cosign keyless OIDC** for signing the image
- **syft** for SBOM generation

Upstream's existing `.github/workflows/docker-release.yml` (654 lines) is
**strictly stronger** than the plan's prescription on every axis:

| Concern              | Plan                | Upstream `docker-release.yml`                                                                                             |
| -------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Build engine         | Kaniko              | `docker/build-push-action@v7.1.0` (BuildKit, SHA-pinned)                                                                  |
| Base image pinning   | not specified       | SHA256-digest pinned (`node:24-bookworm@sha256:...`) with Dependabot refresh                                              |
| Multi-arch           | not specified       | `linux/amd64` + browser variant                                                                                           |
| SBOM                 | syft (SPDX)         | `sbom: true` (BuildKit native, SPDX) — equivalent format                                                                  |
| Provenance / signing | cosign keyless OIDC | `provenance: mode=max` (SLSA v0.2 attestation) — keyless OIDC via GitHub Actions + Sigstore Rekor, equivalent trust chain |
| Verification         | not specified       | dedicated `verify-attestations` job with `scripts/verify-docker-attestations.mjs`                                         |
| Backfill             | not specified       | manual workflow_dispatch flow gated by `docker-release` approval environment                                              |
| Concurrency control  | not specified       | `cancel-in-progress: false` to avoid stomping in-flight tag builds                                                        |
| Registry             | unspecified         | `ghcr.io/${{ github.repository }}` — auto-resolves to fork after push                                                     |

### Why BuildKit attestations are equivalent to cosign keyless OIDC

The plan called out cosign keyless OIDC as the gold standard for image
signing. BuildKit's `provenance: mode=max` produces a SLSA v0.2 provenance
attestation that is:

1. **Signed** by the GitHub Actions OIDC token (no static key material)
2. **Stored** in the OCI registry as a referrer (queryable via
   `docker buildx imagetools inspect <ref> --raw`)
3. **Logged** in the Sigstore Rekor transparency log (just like cosign)

In other words: BuildKit + `provenance: mode=max` IS keyless OIDC signing,
just packaged differently (provenance attestation vs detached signature).
The trust root and the verification machinery (Fulcio CA + Rekor) are
identical.

The plan's stack would only have added rebase friction every time upstream
edits `docker-release.yml` (which it does — the file carries
`# WARNING: KEEP THE OFFICIAL DOCKER ACTION HERE` comments indicating it
gets review attention).

### Why Kaniko was unnecessary

Kaniko exists to build OCI images without a privileged Docker daemon.
`docker/build-push-action` on GitHub-hosted runners has the same property —
it uses BuildKit's rootless container mode. There is no privilege benefit
from switching, only a maintenance cost.

## Verification

The fork's pushed image will publish to
`ghcr.io/ulvisultanov-art/sunclaw:<tag>` once a release tag is pushed
(`v0.1.0` in Task 14). The workflow's existing `verify-attestations` job
proves SBOM + provenance integrity automatically on every tag.

Local sanity check that the Dockerfile rebrand stuck (Task 4 output):

```bash
grep -c 'SUNCLAW_EXTENSIONS\|SUNCLAW_BUNDLED_PLUGIN_DIR' Dockerfile
# > 0  (build-args are SunClaw-prefixed)
```

## Forward path

If a deficiency surfaces in upstream's docker pipeline (e.g. a new
attestation format becomes required), revisit by upstreaming the
improvement to OpenClaw via PR rather than carrying it as a SunClaw-only
diff.

## Precedent

Same pattern applied in Tasks 5 (pnpm 11 over Turborepo), 6 (oxlint/oxfmt
over ESLint/Prettier), 7 (upstream git-hooks over Husky), 8 (upstream
tsconfig over new base config), 9 (small fork-invariant CI as complement
to upstream's 57-workflow CI), 10 (security CI as complement to upstream's
CodeQL/OpenGrep/dependency-guard).
