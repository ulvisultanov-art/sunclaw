export const SUNCLAW_CLI_ENV_VAR = "SUNCLAW_CLI";
export const SUNCLAW_CLI_ENV_VALUE = "1";

export function markSunClawExecEnv<T extends Record<string, string | undefined>>(env: T): T {
  return {
    ...env,
    [SUNCLAW_CLI_ENV_VAR]: SUNCLAW_CLI_ENV_VALUE,
  };
}

export function ensureSunClawExecMarkerOnProcess(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  env[SUNCLAW_CLI_ENV_VAR] = SUNCLAW_CLI_ENV_VALUE;
  return env;
}
