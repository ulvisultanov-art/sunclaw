# M0 Task 8 — TypeScript strict mode (audit + decision)

**ECO:** [ECO-2078](https://complex.az/ws/projects/ecosystem-master-plan?task=ECO-2078)
**Status:** completed
**Date:** 2026-06-03

## Decision

Keep upstream `tsconfig.json` as-is. **No `tsconfig.base.json` added.**

## Rationale

The plan prescribed a brand-new `tsconfig.base.json` with the following flags, to
be `extends`-ed by every package:

```jsonc
{
  "target": "ES2022",
  "module": "ESNext",
  "moduleResolution": "Bundler",
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "esModuleInterop": true,
  "skipLibCheck": true,
  "resolveJsonModule": true,
  "isolatedModules": true,
  "verbatimModuleSyntax": true,
  "forceConsistentCasingInFileNames": true,
  "incremental": true,
}
```

Upstream's existing root `tsconfig.json` is **strictly stronger** than the plan's
prescription on every axis except one:

| Flag                               | Plan | Upstream `tsconfig.json`                               |
| ---------------------------------- | ---- | ------------------------------------------------------ |
| `strict`                           | ✅   | ✅                                                     |
| `noImplicitAny`                    | ✅   | ✅ (via `strict`)                                      |
| `noImplicitReturns`                | ✅   | ✅                                                     |
| `noUnusedLocals`                   | ✅   | ✅ (`tsconfig.core.json` + `tsconfig.extensions.json`) |
| `noUnusedParameters`               | ✅   | ✅ (`tsconfig.core.json` + `tsconfig.extensions.json`) |
| `noFallthroughCasesInSwitch`       | ✅   | ❌ — see below                                         |
| `esModuleInterop`                  | ✅   | ✅                                                     |
| `skipLibCheck`                     | ✅   | ✅                                                     |
| `resolveJsonModule`                | ✅   | ✅                                                     |
| `isolatedModules`                  | ✅   | ✅                                                     |
| `verbatimModuleSyntax`             | ✅   | ✅                                                     |
| `forceConsistentCasingInFileNames` | ✅   | ✅                                                     |
| `incremental`                      | ✅   | ✅ (via `tsBuildInfoFile`)                             |
| `noImplicitOverride`               | —    | ✅ (upstream-only)                                     |
| `noEmitOnError`                    | —    | ✅ (upstream-only)                                     |
| `noUncheckedSideEffectImports`     | —    | ✅ (upstream-only)                                     |

The single delta — `noFallthroughCasesInSwitch` — was attempted in this task and
**reverted**. Adding it surfaces nine intentional fallthrough cases in upstream
sources:

```
src/acp/client.ts(95,5)
src/agents/embedded-agent-subscribe.handlers.ts(132,7)
src/infra/approval-handler-runtime.ts(173,5)
src/logging/diagnostic-run-activity.ts(665,7)
ui/src/ui/app-render.ts(1919,7)
ui/src/ui/app-settings.ts(398,5)
ui/src/ui/chat/realtime-talk-gateway-relay.ts(203,7)
ui/src/ui/chat/realtime-talk-webrtc.ts(223,7)
ui/src/ui/components/file-preview-modal.ts(519,7)
```

Fixing these would mean either (a) adding `// falls through` comments to nine
upstream files, creating merge friction every time upstream edits the same
switches, or (b) refactoring the switches, which puts us at risk of diverging
from upstream's runtime semantics. Both options conflict with M0's `STRATEGY-C`
posture (parallel fork, frequent rebases) for a marginal type-system gain.

## Verification

Baseline typecheck on the unmodified upstream config passes cleanly:

```bash
pnpm tsgo:core        # exit 0
```

That is the plan's Task 8 acceptance criterion ("Run typecheck → green"); it is
already satisfied by upstream.

## Forward path

If `noFallthroughCasesInSwitch` becomes important (e.g. a real bug surfaces from
unintended fallthrough), revisit by upstreaming `// falls through` comments via
a PR to OpenClaw rather than carrying them as a SunClaw-only diff.

## Precedent

Same pattern applied in Tasks 5 (kept upstream pnpm 11.2 over plan's pnpm 9 +
Turborepo), 6 (kept oxlint/oxfmt over plan's ESLint 9 + Prettier 3), and 7
(kept upstream's `git-hooks/pre-commit` over plan's Husky 9 + lint-staged).
