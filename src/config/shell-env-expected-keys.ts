import { uniqueStrings } from "@sunclaw/normalization-core/string-normalization";
import { listKnownChannelEnvVarNames } from "../secrets/channel-env-vars.js";
import { listKnownProviderAuthEnvVarNames } from "../secrets/provider-env-vars.js";

const CORE_SHELL_ENV_EXPECTED_KEYS = ["SUNCLAW_GATEWAY_TOKEN", "SUNCLAW_GATEWAY_PASSWORD"];

export function resolveShellEnvExpectedKeys(env: NodeJS.ProcessEnv): string[] {
  return uniqueStrings([
    ...listKnownProviderAuthEnvVarNames({ env }),
    ...listKnownChannelEnvVarNames({ env }),
    ...CORE_SHELL_ENV_EXPECTED_KEYS,
  ]);
}
