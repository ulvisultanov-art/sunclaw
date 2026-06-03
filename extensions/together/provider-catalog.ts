import { buildManifestModelProviderConfig } from "sunclaw/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "sunclaw/plugin-sdk/provider-model-shared";
import manifest from "./sunclaw.plugin.json" with { type: "json" };

export function buildTogetherProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "together",
    catalog: manifest.modelCatalog.providers.together,
  });
}
