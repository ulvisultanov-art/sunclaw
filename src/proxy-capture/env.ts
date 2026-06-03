import { randomUUID } from "node:crypto";
import type { Agent } from "node:http";
import process from "node:process";
import { createAmbientNodeProxyAgent } from "@openclaw/proxyline";
import {
  resolveDebugProxyBlobDir,
  resolveDebugProxyCertDir,
  resolveDebugProxyDbPath,
} from "./paths.js";

export const SUNCLAW_DEBUG_PROXY_ENABLED = "SUNCLAW_DEBUG_PROXY_ENABLED";
export const SUNCLAW_DEBUG_PROXY_URL = "SUNCLAW_DEBUG_PROXY_URL";
export const SUNCLAW_DEBUG_PROXY_DB_PATH = "SUNCLAW_DEBUG_PROXY_DB_PATH";
export const SUNCLAW_DEBUG_PROXY_BLOB_DIR = "SUNCLAW_DEBUG_PROXY_BLOB_DIR";
export const SUNCLAW_DEBUG_PROXY_CERT_DIR = "SUNCLAW_DEBUG_PROXY_CERT_DIR";
export const SUNCLAW_DEBUG_PROXY_SESSION_ID = "SUNCLAW_DEBUG_PROXY_SESSION_ID";
export const SUNCLAW_DEBUG_PROXY_REQUIRE = "SUNCLAW_DEBUG_PROXY_REQUIRE";

export type DebugProxySettings = {
  enabled: boolean;
  required: boolean;
  proxyUrl?: string;
  dbPath: string;
  blobDir: string;
  certDir: string;
  sessionId: string;
  sourceProcess: string;
};

let cachedImplicitSessionId: string | undefined;

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function resolveDebugProxySettings(
  env: NodeJS.ProcessEnv = process.env,
): DebugProxySettings {
  const enabled = isTruthy(env[SUNCLAW_DEBUG_PROXY_ENABLED]);
  const explicitSessionId = env[SUNCLAW_DEBUG_PROXY_SESSION_ID]?.trim() || undefined;
  const sessionId = explicitSessionId ?? (cachedImplicitSessionId ??= randomUUID());
  return {
    enabled,
    required: isTruthy(env[SUNCLAW_DEBUG_PROXY_REQUIRE]),
    proxyUrl: env[SUNCLAW_DEBUG_PROXY_URL]?.trim() || undefined,
    dbPath: env[SUNCLAW_DEBUG_PROXY_DB_PATH]?.trim() || resolveDebugProxyDbPath(env),
    blobDir: env[SUNCLAW_DEBUG_PROXY_BLOB_DIR]?.trim() || resolveDebugProxyBlobDir(env),
    certDir: env[SUNCLAW_DEBUG_PROXY_CERT_DIR]?.trim() || resolveDebugProxyCertDir(env),
    sessionId,
    sourceProcess: "sunclaw",
  };
}

export function applyDebugProxyEnv(
  env: NodeJS.ProcessEnv,
  params: {
    proxyUrl: string;
    sessionId: string;
    dbPath?: string;
    blobDir?: string;
    certDir?: string;
  },
): NodeJS.ProcessEnv {
  return {
    ...env,
    [SUNCLAW_DEBUG_PROXY_ENABLED]: "1",
    [SUNCLAW_DEBUG_PROXY_REQUIRE]: "1",
    [SUNCLAW_DEBUG_PROXY_URL]: params.proxyUrl,
    [SUNCLAW_DEBUG_PROXY_DB_PATH]: params.dbPath ?? resolveDebugProxyDbPath(env),
    [SUNCLAW_DEBUG_PROXY_BLOB_DIR]: params.blobDir ?? resolveDebugProxyBlobDir(env),
    [SUNCLAW_DEBUG_PROXY_CERT_DIR]: params.certDir ?? resolveDebugProxyCertDir(env),
    [SUNCLAW_DEBUG_PROXY_SESSION_ID]: params.sessionId,
    HTTP_PROXY: params.proxyUrl,
    HTTPS_PROXY: params.proxyUrl,
    ALL_PROXY: params.proxyUrl,
  };
}

export function createDebugProxyWebSocketAgent(settings: DebugProxySettings): Agent | undefined {
  if (!settings.enabled || !settings.proxyUrl) {
    return undefined;
  }
  return createAmbientNodeProxyAgent({
    protocol: "https",
    env: {
      HTTP_PROXY: settings.proxyUrl,
      HTTPS_PROXY: settings.proxyUrl,
      ALL_PROXY: undefined,
      NO_PROXY: undefined,
      http_proxy: undefined,
      https_proxy: undefined,
      all_proxy: undefined,
      no_proxy: undefined,
    },
  }) as Agent | undefined;
}

export function resolveEffectiveDebugProxyUrl(configuredProxyUrl?: string): string | undefined {
  const explicit = configuredProxyUrl?.trim();
  if (explicit) {
    return explicit;
  }
  const settings = resolveDebugProxySettings();
  return settings.enabled ? settings.proxyUrl : undefined;
}
