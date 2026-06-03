import deprecatedPublicPluginSdkSubpaths from "./plugin-sdk-deprecated-public-subpaths.json" with { type: "json" };

const DEPRECATED_PLUGIN_SDK_EXTRA_SPECIFIERS = [
  "sunclaw/plugin-sdk",
  "sunclaw/plugin-sdk/agent-dir-compat",
  "sunclaw/plugin-sdk/test-utils",
];

export function buildDeprecatedPluginSdkModuleSpecifiers(
  deprecatedSubpaths = deprecatedPublicPluginSdkSubpaths,
) {
  return [
    ...new Set([
      ...DEPRECATED_PLUGIN_SDK_EXTRA_SPECIFIERS,
      ...deprecatedSubpaths.map((subpath) => `sunclaw/plugin-sdk/${subpath}`),
    ]),
  ].toSorted();
}
