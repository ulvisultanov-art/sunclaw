# SunClaw M1 — K8s Deployment

- **Status:** Accepted 2026-06-03
- **Milestone:** M1 under programme ECO-2077
- **PM task:** [ECO-2086](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2086)
- **Companion ADR (sunecosystem):** `docs/architecture/adrs/ADR-0011-sunclaw-multi-channel-ai-gateway.md`
- **Plan:** `docs/superpowers/plans/2026-06-03-sunclaw-m1-deployment.md` (in `sunecosystem`)

## Why this file lives in the SunClaw repo

This is the fork-side mirror of the decision recorded in
sunecosystem's ADR-0011. The same milestone closes from two
repositories at once:

| Repo                                                                               | What lands                                                                                         |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `sunecosystem` (private, ArgoCD-watched, mirrored to `ulvisultanov-art/complexaz`) | Helm chart, ArgoCD Application, Kaniko build Pod, Cloudflare Tunnel desired-state mirror, ADR-0011 |
| `sunclaw` (public MIT fork, this repo)                                             | CHANGELOG v0.2.0 entry + this ADR documenting the deployment shape                                 |

The split exists because the upstream OpenClaw image and source are
deliberately deployable anywhere — putting K8s manifests inside the
fork would couple it to SUN's cluster topology. The fork stays portable;
SUN-specific deployment artefacts live in `sunecosystem`.

## Deployment shape (M1)

```
                                      ┌────────────────────────────────┐
                                      │ ulvisultanov-art/complexaz     │
                                      │ (sunecosystem GitOps source)   │
                                      ├────────────────────────────────┤
   git push origin main ───────────▶  │  infra/helm/sunclaw/           │
                                      │  infra/argocd/applications/    │
                                      │    platforms/sunclaw.yaml      │
                                      │  infra/build/                  │
                                      │    kaniko-sunclaw-v0.2.0.yaml  │
                                      │  infra/cloudflare/             │
                                      │    tunnel-config-sunclaw.yaml  │
                                      └─────────────┬──────────────────┘
                                                    │ ArgoCD watch
                                                    ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │ Talos K8s 1.34 / AX162-R (sundocker01)                           │
   ├──────────────────────────────────────────────────────────────────┤
   │  ns: complex-sunclaw   (PodSecurity=restricted)                  │
   │    Deployment sunclaw       (2 replicas, --bind lan --port 18789)│
   │    Service     sunclaw      (ClusterIP :18789)                   │
   │    HPA         sunclaw      (2-6, CPU 70%)                       │
   │    NetworkPolicy sunclaw    (ingress: cloudflared ns ONLY)       │
   │    ExternalSecret sunclaw-api-keys                               │
   │       └─ ClusterSecretStore vault-cluster                        │
   │          └─ secret/complex-sunclaw/api-keys                      │
   │             (anthropic + openai + openrouter)                    │
   │                                                                  │
   │  ns: cloudflared                                                 │
   │    cloudflared-XXX  (tunnel 08d80e87-…)                          │
   │      └─ ingress route: sunclaw.complex.az  ──┐                   │
   │                                              │                   │
   │  ns: complex-infra                           │                   │
   │    one-shot Pod kaniko-sunclaw-v0-2-0        │                   │
   │      └─ clones sunclaw@sunclaw-v0.1.0        │                   │
   │      └─ pushes registry.complex.az/sunclaw:sunclaw-v0.2.0        │
   └──────────────────────────────────────────────────────────────────┘
```

## Source ↔ image ↔ deploy tag mapping

| Concept                         | Value                                        | Repo                       |
| ------------------------------- | -------------------------------------------- | -------------------------- |
| **Fork source tag** (this repo) | `sunclaw-v0.1.0`                             | `sunclaw`                  |
| **Image tag**                   | `registry.complex.az/sunclaw:sunclaw-v0.2.0` | (registry)                 |
| **K8s deploy cut** (CHANGELOG)  | `0.2.0`                                      | `sunclaw` (this file)      |
| **ArgoCD pinned image.tag**     | `sunclaw-v0.2.0`                             | `sunecosystem` Application |

The pattern: **each milestone bumps the deploy cut even if the source
is unchanged**. M0 = `0.1.0` (fork), M1 = `0.2.0` (K8s-deployable cut
of the same `0.1.0` source). A later milestone that ships source
changes will bump source first, then the deploy cut alongside.

This pattern keeps the deploy-cut version monotonically increasing and
makes the ArgoCD `image.tag` line meaningful to operators: every PR
that bumps `sunclaw-vX.Y.Z` is a real-world deploy event, not a no-op
re-tag.

## Operator runbook (M1 only)

The full runbook lives in the sunecosystem plan
(`docs/superpowers/plans/2026-06-03-sunclaw-m1-deployment.md`, Task 11).
This is the short form:

1. **External prerequisites** (USER-GATED — must complete before pushing
   the GitOps change):
   - Vault: write `secret/complex-sunclaw/api-keys` with keys
     `anthropic`, `openai`, `openrouter`.
   - Cloudflare DNS: create the proxied CNAME
     `sunclaw.complex.az → 08d80e87-6f4e-493a-8d9a-b348d26172be.cfargotunnel.com`.
2. Push the `sunecosystem` branch to main. ArgoCD picks up
   `infra/argocd/applications/platforms/sunclaw.yaml` within ~3 min.
3. The Application syncs but the Deployment will be `ImagePullBackOff`
   until the image exists. Build it:
   ```bash
   export KUBECONFIG=<path>
   kubectl apply -f infra/build/kaniko-sunclaw-v0.2.0.yaml
   kubectl -n complex-infra logs -f kaniko-sunclaw-v0-2-0
   # On Completed:
   kubectl -n complex-infra delete pod kaniko-sunclaw-v0-2-0
   ```
4. Force a sync (or wait):
   ```bash
   argocd app sync sunclaw
   ```
5. Add the Cloudflare Tunnel ingress rule for `sunclaw.complex.az`
   (Zero Trust API or future `cf-tunnel-sync.sh`).
6. Smoke test:
   ```bash
   curl -sI https://sunclaw.complex.az/healthz       # → HTTP/2 200
   curl -sI https://sunclaw.complex.az/readyz        # → HTTP/2 200
   ```

## Security posture summary (M1)

| Concern                                    | M1 posture                                          | Owning milestone |
| ------------------------------------------ | --------------------------------------------------- | ---------------- |
| Vault-backed provider keys                 | ✅ via ExternalSecret + `vault-cluster`             | M1               |
| PodSecurity=restricted enforced            | ✅ namespace label, non-root container              | M1               |
| Inbound only via Cloudflare Tunnel         | ✅ NetworkPolicy ingress = cloudflared ns           | M1               |
| Egress limited to 443 + DNS                | ✅ NetworkPolicy + Cilium default                   | M1               |
| Image scanned for CVEs pre-deploy          | ❌ deferred to M7 (SLSA L3 pipeline includes Trivy) | M7               |
| Build provenance (in-toto / cosign attest) | ❌ deferred to M7                                   | M7               |
| ClawHub gated to `*.complex.az` IdP        | ❌ deferred to M2 (Cloudflare Access JWT)           | M2               |
| Per-identity bearer tokens                 | ❌ deferred to M3 (multi-tenancy mode B)            | M3               |
| SLO dashboards + PrometheusRule alerts     | ❌ deferred to M7                                   | M7               |
| Runbook for tunnel-down / pod-crashloop    | ❌ deferred to M7                                   | M7               |

The deferred items are all tracked under programme ECO-2077; nothing
that is deferred from M1 is a _security regression_ relative to the
current state — they are _new_ defences that the upstream OpenClaw
project does not ship, and that SUN adds incrementally as the
multi-channel surface comes online.

## Re-evaluation triggers

- Upstream OpenClaw publishes a release that adds first-class K8s
  manifests with a comparable security posture → re-assess whether
  this fork still needs `sunecosystem` Helm chart, or could consume
  upstream charts directly.
- Talos / cluster migration (e.g. to a new control plane) → revisit
  Service / NetworkPolicy / ExternalSecret references; nothing in this
  doc is portable across clusters.
