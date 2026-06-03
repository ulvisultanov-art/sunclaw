import path from "node:path";
import { normalizeAgentId } from "../routing/session-key.js";
import { resolveSunClawStateSqliteDir } from "./sunclaw-state-db.paths.js";

export type SunClawAgentSqlitePathOptions = {
  agentId: string;
  env?: NodeJS.ProcessEnv;
  path?: string;
};

export function resolveSunClawAgentSqlitePath(options: SunClawAgentSqlitePathOptions): string {
  const agentId = normalizeAgentId(options.agentId);
  return (
    options.path ??
    path.join(
      path.dirname(resolveSunClawStateSqliteDir(options.env ?? process.env)),
      "agents",
      agentId,
      "agent",
      "sunclaw-agent.sqlite",
    )
  );
}

export function resolveSunClawAgentSqliteDir(options: SunClawAgentSqlitePathOptions): string {
  return path.dirname(resolveSunClawAgentSqlitePath(options));
}
