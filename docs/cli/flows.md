---
summary: "Redirect: flow commands live under `sunclaw tasks flow`"
read_when:
  - You encounter `sunclaw flows` in older docs or release notes
  - You want a quick TaskFlow inspection reference
title: "Flows (redirect)"
---

# `sunclaw tasks flow`

There is no top-level `sunclaw flows` command. Durable TaskFlow inspection lives under `sunclaw tasks flow`.

## Subcommands

```bash
sunclaw tasks flow list   [--json] [--status <name>]
sunclaw tasks flow show   <lookup> [--json]
sunclaw tasks flow cancel <lookup>
```

| Subcommand | Description                | Arguments / options                                                                   |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | List tracked TaskFlows.    | `--json` machine-readable output; `--status <name>` filter (see status values below). |
| `show`     | Show one TaskFlow.         | `<lookup>` flow id or owner key; `--json` machine-readable output.                    |
| `cancel`   | Cancel a running TaskFlow. | `<lookup>` flow id or owner key.                                                      |

`<lookup>` accepts either a flow id (returned by `list` / `show`) or the flow's owner key (the stable identifier the owning subsystem uses to track the flow).

### Status filter values

`--status` on `list` accepts one of:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Examples

```bash
sunclaw tasks flow list
sunclaw tasks flow list --status running
sunclaw tasks flow list --json
sunclaw tasks flow show flow_abc123
sunclaw tasks flow show flow_abc123 --json
sunclaw tasks flow cancel flow_abc123
```

For full TaskFlow concepts and authoring see [TaskFlow](/automation/taskflow). For the parent `tasks` command see [tasks CLI reference](/cli/tasks).

## Related

- [CLI reference](/cli)
- [Automation](/automation)
- [TaskFlow](/automation/taskflow)
