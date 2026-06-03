import { describe, expect, it, vi, beforeEach } from "vitest";
import { fetchAndCacheJwks, _resetJwksCacheForTests } from "./jwks-cache";

describe("jwks-cache", () => {
  beforeEach(() => {
    _resetJwksCacheForTests();
    vi.restoreAllMocks();
  });

  it("fetches JWKS once and serves the cached copy on the second call", async () => {
    const sample = { keys: [{ kid: "k1", kty: "RSA", n: "x", e: "AQAB" }] };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(sample), { status: 200 }));

    const a = await fetchAndCacheJwks({ teamDomain: "complex" });
    const b = await fetchAndCacheJwks({ teamDomain: "complex" });

    expect(a).toEqual(sample);
    expect(b).toEqual(sample);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("refetches when the requested kid is missing from the cache", async () => {
    const v1 = { keys: [{ kid: "k1", kty: "RSA", n: "x", e: "AQAB" }] };
    const v2 = { keys: [{ kid: "k2", kty: "RSA", n: "y", e: "AQAB" }] };
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify(v1), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(v2), { status: 200 }));

    await fetchAndCacheJwks({ teamDomain: "complex" });
    const result = await fetchAndCacheJwks({ teamDomain: "complex", requireKid: "k2" });

    expect(result).toEqual(v2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("throws when JWKS endpoint returns non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 503 }));
    await expect(fetchAndCacheJwks({ teamDomain: "complex" })).rejects.toThrow(/JWKS fetch failed/);
  });
});
