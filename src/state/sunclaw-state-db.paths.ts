import os from "node:os";
import path from "node:path";
import { isMainThread, threadId } from "node:worker_threads";
import { resolveStateDir } from "../config/paths.js";
import { parseStrictNonNegativeInteger } from "../infra/parse-finite-number.js";

function resolveSunClawStateRootDir(env: NodeJS.ProcessEnv): string {
  if (env.SUNCLAW_STATE_DIR?.trim()) {
    return resolveStateDir(env);
  }
  if (env.VITEST || env.NODE_ENV === "test") {
    const workerId = parseStrictNonNegativeInteger(
      env.VITEST_WORKER_ID ?? env.VITEST_POOL_ID ?? "",
    );
    const shardSuffix =
      workerId !== undefined
        ? `${process.pid}-${workerId}`
        : isMainThread
          ? String(process.pid)
          : `${process.pid}-${threadId}`;
    return path.join(os.tmpdir(), "sunclaw-test-state", shardSuffix);
  }
  return resolveStateDir(env);
}

export function resolveSunClawStateSqliteDir(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveSunClawStateRootDir(env), "state");
}

export function resolveSunClawStateSqlitePath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(resolveSunClawStateSqliteDir(env), "sunclaw.sqlite");
}
