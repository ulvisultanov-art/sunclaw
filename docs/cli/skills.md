---
summary: "CLI reference for `sunclaw skills` (search/install/update/verify/list/info/check/workshop)"
read_when:
  - You want to see which skills are available and ready to run
  - You want to search ClawHub or install skills from ClawHub, Git, or local directories
  - You want to verify a ClawHub skill with ClawHub
  - You want to debug missing binaries/env/config for skills
title: "Skills"
---

# `sunclaw skills`

Inspect local skills, search ClawHub, install skills from ClawHub/Git/local
directories, verify ClawHub skills, and update ClawHub-tracked installs.

Related:

- Skills system: [Skills](/tools/skills)
- Skill Workshop: [Skill Workshop](/tools/skill-workshop)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub installs: [ClawHub](/clawhub/cli)

## Commands

```bash
sunclaw skills search "calendar"
sunclaw skills search --limit 20 --json
sunclaw skills install <slug>
sunclaw skills install <slug> --version <version>
sunclaw skills install git:owner/repo
sunclaw skills install git:owner/repo@main
sunclaw skills install ./path/to/skill --as custom-name
sunclaw skills install <slug> --force
sunclaw skills install <slug> --agent <id>
sunclaw skills install <slug> --global
sunclaw skills update <slug>
sunclaw skills update <slug> --global
sunclaw skills update --all
sunclaw skills update --all --agent <id>
sunclaw skills update --all --global
sunclaw skills verify <slug>
sunclaw skills verify <slug> --version <version>
sunclaw skills verify <slug> --tag <tag>
sunclaw skills verify <slug> --card
sunclaw skills verify <slug> --global
sunclaw skills list
sunclaw skills list --eligible
sunclaw skills list --json
sunclaw skills list --verbose
sunclaw skills list --agent <id>
sunclaw skills info <name>
sunclaw skills info <name> --json
sunclaw skills info <name> --agent <id>
sunclaw skills check
sunclaw skills check --agent <id>
sunclaw skills check --json
sunclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
sunclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
sunclaw skills workshop list
sunclaw skills workshop inspect <proposal-id>
sunclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
sunclaw skills workshop apply <proposal-id>
sunclaw skills workshop reject <proposal-id> --reason "Not reusable"
sunclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, and `verify` use ClawHub directly. `install <slug>` installs
a ClawHub skill, `install git:owner/repo[@ref]` clones a Git skill, and
`install ./path` copies a local skill directory. By default, `install`, `update`,
and `verify` target the active workspace `skills/` directory; with `--global`,
they target the shared managed skills directory. `list`/`info`/`check` still
inspect the local skills visible to the current workspace and config.
Workspace-backed commands resolve the target workspace from `--agent <id>`, then
the current working directory when it is inside a configured agent workspace,
then the default agent.

Git and local directory installs expect `SKILL.md` at the source root. The
install slug comes from `SKILL.md` frontmatter `name` when it is valid, then the
source directory or repository name; use `--as <slug>` to override it. `--version`
is ClawHub-only. Skill installs do not support npm package specs or zip/archive
paths, and `sunclaw skills update` updates ClawHub-tracked installs only.

Gateway-backed skill dependency installs triggered from onboarding or Skills
settings use the separate `skills.install` request path instead.

Notes:

- `search [query...]` accepts an optional query; omit it to browse the default
  ClawHub search feed.
- `search --limit <n>` caps returned results.
- `install git:owner/repo[@ref]` installs a Git skill. Branch refs may contain
  slashes, such as `git:owner/repo@feature/foo`.
- `install ./path/to/skill` installs a local directory whose root contains
  `SKILL.md`.
- `install --as <slug>` overrides the inferred slug for Git and local directory
  installs.
- `install --version <version>` applies only to ClawHub skill slugs.
- `install --force` overwrites an existing workspace skill folder for the same
  slug.
- `--global` targets the shared managed skills directory and cannot be combined
  with `--agent <id>`.
- `--agent <id>` targets one configured agent workspace and overrides current
  working directory inference.
- `update <slug>` updates a single tracked skill. Add `--global` to target the
  shared managed skills directory instead of the workspace.
- `update --all` updates tracked ClawHub installs in the selected workspace, or
  in the shared managed skills directory when combined with `--global`.
- `verify <slug>` prints ClawHub's `clawhub.skill.verify.v1` JSON envelope by
  default. There is no `--json` flag because JSON is already the default.
- `verify` uses `.clawhub/origin.json` for installed ClawHub skills, so it
  verifies the installed version against the registry it came from. `--version`
  and `--tag` override the version selector but keep that installed registry
  when origin metadata exists.
- `verify --card` prints the generated Skill Card Markdown instead of JSON. The
  command exits non-zero when ClawHub returns `ok: false` or `decision: "fail"`;
  unsigned signatures are informational unless ClawHub policy changes.
- Installed ClawHub bundles can include a generated `skill-card.md`. SunClaw
  treats verification as a ClawHub server decision and does not reject an
  installed skill just because that generated card changes the bundle
  fingerprint.
- `check --agent <id>` checks the selected agent's workspace and reports which
  ready skills are actually visible to that agent's prompt or command surface.
- `list` is the default action when no subcommand is provided.
- `list`, `info`, and `check` write their rendered output to stdout. With
  `--json`, that means the machine-readable payload stays on stdout for pipes
  and scripts.

## Skill Workshop

`sunclaw skills workshop` manages pending skill proposals in the selected
workspace. Proposals are not active skills until applied. For proposal storage,
support-file safeguards, Gateway methods, and approval policy, see
[Skill Workshop](/tools/skill-workshop).

```bash
sunclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
sunclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
sunclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
sunclaw skills workshop list
sunclaw skills workshop inspect <proposal-id>
sunclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
sunclaw skills workshop apply <proposal-id>
sunclaw skills workshop reject <proposal-id> --reason "Duplicate"
sunclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

## Related

- [CLI reference](/cli)
- [Skills](/tools/skills)
