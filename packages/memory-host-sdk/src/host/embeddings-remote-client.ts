import type { EmbeddingProviderOptions } from "./embeddings.types.js";
import { buildRemoteBaseUrlPolicy } from "./remote-http.js";
import { resolveMemorySecretInputString } from "./secret-input.js";
import type { SsrFPolicy } from "./ssrf-policy.js";
import { normalizeOptionalString } from "./string-utils.js";
import { requireApiKey, resolveApiKeyForProvider } from "./sunclaw-runtime-auth.js";

export type RemoteEmbeddingProviderId = string;

function resolveSunClawAttributionHeaders(): Record<string, string> {
  const version = typeof process !== "undefined" ? process.env.SUNCLAW_VERSION?.trim() : undefined;
  return {
    originator: "sunclaw",
    ...(version ? { version } : {}),
    "User-Agent": version ? `sunclaw/${version}` : "sunclaw",
  };
}

function isNativeOpenAIEmbeddingRoute(provider: string, baseUrl: string): boolean {
  if (provider !== "openai") {
    return false;
  }
  try {
    return new URL(baseUrl).hostname.toLowerCase().replace(/\.+$/, "") === "api.openai.com";
  } catch {
    return false;
  }
}

export async function resolveRemoteEmbeddingBearerClient(params: {
  provider: RemoteEmbeddingProviderId;
  options: EmbeddingProviderOptions;
  defaultBaseUrl: string;
}): Promise<{ baseUrl: string; headers: Record<string, string>; ssrfPolicy?: SsrFPolicy }> {
  const remote = params.options.remote;
  const remoteApiKey = resolveMemorySecretInputString({
    value: remote?.apiKey,
    path: "agents.*.memorySearch.remote.apiKey",
  });
  const remoteBaseUrl = normalizeOptionalString(remote?.baseUrl);
  const providerConfig = params.options.config.models?.providers?.[params.provider];
  const apiKey = remoteApiKey
    ? remoteApiKey
    : requireApiKey(
        await resolveApiKeyForProvider({
          provider: params.provider,
          cfg: params.options.config,
          agentDir: params.options.agentDir,
        }),
        params.provider,
      );
  const baseUrl =
    remoteBaseUrl || normalizeOptionalString(providerConfig?.baseUrl) || params.defaultBaseUrl;
  const headerOverrides = Object.assign({}, providerConfig?.headers, remote?.headers);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...headerOverrides,
  };
  if (isNativeOpenAIEmbeddingRoute(params.provider, baseUrl)) {
    Object.assign(headers, resolveSunClawAttributionHeaders());
  }
  return { baseUrl, headers, ssrfPolicy: buildRemoteBaseUrlPolicy(baseUrl) };
}
