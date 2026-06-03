type PublicPluginSdkModules = [
  typeof import("sunclaw/plugin-sdk"),
  typeof import("sunclaw/plugin-sdk/channel-entry-contract"),
  typeof import("sunclaw/plugin-sdk/config-contracts"),
  typeof import("sunclaw/plugin-sdk/provider-entry"),
  typeof import("sunclaw/plugin-sdk/runtime-env"),
];

const resolvedModules = null as unknown as PublicPluginSdkModules;

void resolvedModules;
