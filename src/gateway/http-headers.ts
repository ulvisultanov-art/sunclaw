/**
 * Tiny, dependency-free HTTP header helpers shared across the gateway.
 *
 * Lives in its own module so it can be consumed by both `auth.ts` (which
 * extracts the Cloudflare Access JWT inside the dispatcher) and
 * `http-auth-utils.ts` (which keeps the helpers re-exported for
 * discoverability next to `getBearerToken`). Splitting the helpers out
 * avoids a runtime import cycle: `auth.ts` must not depend on
 * `http-auth-utils.ts`, because `http-auth-utils.ts` imports
 * `authorizeHttpGatewayConnect` from `auth.ts`.
 */

import type { IncomingMessage } from "node:http";
import {
  normalizeLowercaseStringOrEmpty,
  normalizeOptionalString,
} from "@sunclaw/normalization-core/string-coerce";

/** Read a single request header, normalizing case and unwrapping array values. */
export function getHeader(req: IncomingMessage, name: string): string | undefined {
  const raw = req.headers[normalizeLowercaseStringOrEmpty(name)];
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw[0];
  }
  return undefined;
}

/**
 * Reads the Cloudflare Access JWT from the standard request header.
 *
 * Cloudflare populates `Cf-Access-Jwt-Assertion` on every request that has
 * been authenticated by an Access Application. The same value is also placed
 * in a `CF_Authorization` cookie, but the header is the primary path (more
 * cache-friendly, no CORS surface) and is what ADR-0012 standardizes on.
 *
 * Returns `undefined` (matching `getBearerToken`) when the header is missing
 * or empty so the dispatcher can synthesize a 401 with
 * `WWW-Authenticate: CF-Access-Required`.
 */
export function getCfAccessJwt(req: IncomingMessage): string | undefined {
  const raw = normalizeOptionalString(getHeader(req, "cf-access-jwt-assertion")) ?? "";
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}
