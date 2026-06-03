import { parseStrictPositiveInteger } from "../../../infra/parse-finite-number.js";

type AbortSettleTimeoutEnv = Partial<
  Pick<NodeJS.ProcessEnv, "SUNCLAW_EMBEDDED_ABORT_SETTLE_TIMEOUT_MS" | "SUNCLAW_TEST_FAST">
>;

export function resolveEmbeddedAbortSettleTimeoutMs(
  env: AbortSettleTimeoutEnv = process.env,
): number {
  const override = parseStrictPositiveInteger(env.SUNCLAW_EMBEDDED_ABORT_SETTLE_TIMEOUT_MS);
  if (override !== undefined) {
    return override;
  }
  return env.SUNCLAW_TEST_FAST === "1" ? 250 : 2_000;
}
