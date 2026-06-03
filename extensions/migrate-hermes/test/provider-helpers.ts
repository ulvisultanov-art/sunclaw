import fs from "node:fs/promises";
import path from "node:path";
import type { MigrationProviderContext } from "sunclaw/plugin-sdk/plugin-entry";
import type { SunClawConfig } from "sunclaw/plugin-sdk/provider-auth";
import { resolvePreferredSunClawTmpDir } from "sunclaw/plugin-sdk/temp-path";

const tempRoots = new Set<string>();
const TEMP_ROOT_PREFIX = "sunclaw-migrate-hermes-";

function noop() {}

const logger: MigrationProviderContext["logger"] = {
  debug: noop,
  error: noop,
  info: noop,
  warn: noop,
};

export async function makeTempRoot() {
  const root = await fs.mkdtemp(path.join(resolvePreferredSunClawTmpDir(), TEMP_ROOT_PREFIX));
  tempRoots.add(root);
  return root;
}

export async function cleanupTempRoots() {
  await Promise.all([...tempRoots].map((root) => fs.rm(root, { force: true, recursive: true })));
  tempRoots.clear();
}

export async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export function makeConfigRuntime(
  config: SunClawConfig,
  onWrite?: (next: SunClawConfig) => void,
): NonNullable<MigrationProviderContext["runtime"]> {
  const commitConfig = (next: SunClawConfig) => {
    (Object.keys(config) as Array<keyof SunClawConfig>).forEach((key) => delete config[key]);
    Object.assign(config, next);
    onWrite?.(next);
  };

  return {
    config: {
      current: () => config,
      mutateConfigFile: async ({
        afterWrite,
        mutate,
      }: {
        afterWrite?: unknown;
        mutate: (draft: SunClawConfig, context: unknown) => Promise<unknown> | void;
      }) => {
        const next = structuredClone(config);
        const result = await mutate(next, {
          previousHash: null,
          persistedHash: null,
          snapshot: { config, raw: "", hash: null },
        });
        commitConfig(next);
        return {
          afterWrite,
          followUp: { mode: "auto", requiresRestart: false },
          nextConfig: next,
          result,
        };
      },
      replaceConfigFile: async ({
        afterWrite,
        nextConfig,
      }: {
        afterWrite?: unknown;
        nextConfig: SunClawConfig;
      }) => {
        commitConfig(nextConfig);
        return { afterWrite, followUp: { mode: "auto", requiresRestart: false }, nextConfig };
      },
    },
  } as NonNullable<MigrationProviderContext["runtime"]>;
}

export function makeContext(params: {
  source: string;
  stateDir: string;
  workspaceDir: string;
  config?: SunClawConfig;
  includeSecrets?: boolean;
  overwrite?: boolean;
  model?: NonNullable<NonNullable<SunClawConfig["agents"]>["defaults"]>["model"];
  reportDir?: string;
  runtime?: MigrationProviderContext["runtime"];
}): MigrationProviderContext {
  const config =
    params.config ??
    ({
      agents: {
        defaults: {
          workspace: params.workspaceDir,
          ...(params.model !== undefined ? { model: params.model } : {}),
        },
      },
    } as SunClawConfig);
  return {
    config,
    stateDir: params.stateDir,
    source: params.source,
    includeSecrets: params.includeSecrets,
    overwrite: params.overwrite,
    reportDir: params.reportDir,
    runtime: params.runtime,
    logger,
  };
}
