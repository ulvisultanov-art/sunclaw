import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";

export function makeQqbotSecretRefConfig(): SunClawConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as SunClawConfig;
}

export function makeQqbotDefaultAccountConfig(): SunClawConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as SunClawConfig;
}
