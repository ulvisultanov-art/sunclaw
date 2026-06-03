/**
 * Cloudflare Access JWKS cache.
 *
 * Fetches Cloudflare's per-team signing keys from
 *   https://<teamDomain>.cloudflareaccess.com/cdn-cgi/access/certs
 *
 * - Caches in-process for 6 hours (configurable per call via `ttlMs`).
 * - Re-fetches eagerly when the requested `kid` is missing from cache —
 *   handles Cloudflare key rotation (new keys appear instantly without
 *   waiting for the 6h TTL to expire).
 *
 * Surface kept tiny on purpose: this module is only consumed by
 * `./verify.ts`, which is the only entry point the rest of the gateway
 * touches.
 */

export interface FetchJwksParams {
  readonly teamDomain: string;
  /** When set, the cache is bypassed if the cached set lacks a key with this kid. */
  readonly requireKid?: string;
  /** Override TTL (default 6h). Used by tests. */
  readonly ttlMs?: number;
}

export interface JwksDocument {
  readonly keys: ReadonlyArray<{
    readonly kid: string;
    readonly kty: string;
    readonly n?: string;
    readonly e?: string;
    readonly alg?: string;
    readonly use?: string;
  }>;
}

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface CacheEntry {
  readonly document: JwksDocument;
  readonly fetchedAt: number;
  readonly ttlMs: number;
}

const cache = new Map<string, CacheEntry>();

export async function fetchAndCacheJwks(params: FetchJwksParams): Promise<JwksDocument> {
  const { teamDomain, requireKid, ttlMs = DEFAULT_TTL_MS } = params;
  const cacheKey = teamDomain;
  const now = Date.now();
  const cached = cache.get(cacheKey);

  const cacheIsFresh = cached !== undefined && now - cached.fetchedAt < cached.ttlMs;
  const cacheHasKid =
    requireKid === undefined || (cached?.document.keys.some((k) => k.kid === requireKid) ?? false);

  if (cacheIsFresh && cacheHasKid && cached !== undefined) {
    return cached.document;
  }

  const url = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${url} returned HTTP ${response.status}`);
  }
  const document = (await response.json()) as JwksDocument;
  cache.set(cacheKey, { document, fetchedAt: now, ttlMs });
  return document;
}

/** Test-only — clears the in-process cache between cases. */
export function _resetJwksCacheForTests(): void {
  cache.clear();
}
