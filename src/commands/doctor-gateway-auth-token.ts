import { resolveSecretInputRef } from "../config/types.secrets.js";
import type { SunClawConfig } from "../config/types.sunclaw.js";
export { shouldRequireGatewayTokenForInstall } from "../gateway/auth-install-policy.js";
import { resolveGatewayAuthToken } from "../gateway/auth-token-resolution.js";
import { trimToUndefined } from "../gateway/credentials.js";

export async function resolveGatewayAuthTokenForService(
  cfg: SunClawConfig,
  env: NodeJS.ProcessEnv,
  options: { allowExecSecretRefs?: boolean } = {},
): Promise<{ token?: string; unavailableReason?: string }> {
  const tokenRef = resolveSecretInputRef({
    value: cfg.gateway?.auth?.token,
    defaults: cfg.secrets?.defaults,
  }).ref;
  if (tokenRef?.source === "exec" && options.allowExecSecretRefs !== true) {
    const envToken = trimToUndefined(env.SUNCLAW_GATEWAY_TOKEN);
    return envToken ? { token: envToken } : {};
  }
  const resolved = await resolveGatewayAuthToken({
    cfg,
    env,
    unresolvedReasonStyle: "detailed",
    envFallback: "always",
  });
  if (resolved.token) {
    return { token: resolved.token };
  }
  if (!resolved.secretRefConfigured) {
    return {};
  }
  if (resolved.unresolvedRefReason?.includes("resolved to an empty value")) {
    return { unavailableReason: resolved.unresolvedRefReason };
  }
  return {
    unavailableReason: `gateway.auth.token SecretRef is configured but unresolved (${resolved.unresolvedRefReason ?? "unknown reason"}).`,
  };
}
