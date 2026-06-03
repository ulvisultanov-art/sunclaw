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
 * - Deduplicates concurrent fetches for the same cache key so N parallel
 *   callers issue exactly one upstream request.
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

/** In-flight fetch promises keyed by cache key — deduplicates concurrent callers. */
const inflight = new Map<string, Promise<JwksDocument>>();

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

  // Deduplicate: if a fetch is already in flight for this key, await it.
  const pending = inflight.get(cacheKey);
  if (pending !== undefined) {
    return pending;
  }

  const url = `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;

  const fetchPromise = (async (): Promise<JwksDocument> => {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`JWKS fetch failed: ${url} returned HTTP ${response.status}`);
      }

      const parsed: unknown = await response.json();
      if (!parsed || !Array.isArray((parsed as { keys?: unknown }).keys)) {
        throw new Error(`JWKS response from ${url} is malformed: missing keys array`);
      }
      const document = parsed as JwksDocument;

      cache.set(cacheKey, { document, fetchedAt: Date.now(), ttlMs });
      return document;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/** Test-only — clears the in-process cache and inflight map between cases. */
export function _resetJwksCacheForTests(): void {
  cache.clear();
  inflight.clear();
}
