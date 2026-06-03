import os from "node:os";
import path from "node:path";
import { normalizeOptionalLowercaseString } from "@sunclaw/normalization-core/string-coerce";
import { resolveRequiredHomeDir } from "../infra/home-dir.js";

export function resolveDefaultAgentWorkspaceDir(
  env: NodeJS.ProcessEnv = process.env,
  homedir: () => string = os.homedir,
): string {
  const workspaceDir = env.SUNCLAW_WORKSPACE_DIR?.trim();
  if (workspaceDir) {
    return path.resolve(workspaceDir);
  }
  const home = resolveRequiredHomeDir(env, homedir);
  const profile = env.SUNCLAW_PROFILE?.trim();
  if (profile && normalizeOptionalLowercaseString(profile) !== "default") {
    return path.join(home, ".sunclaw", `workspace-${profile}`);
  }
  return path.join(home, ".sunclaw", "workspace");
}

export const DEFAULT_AGENT_WORKSPACE_DIR = resolveDefaultAgentWorkspaceDir();
