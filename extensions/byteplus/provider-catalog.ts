import { buildManifestModelProviderConfig } from "sunclaw/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "sunclaw/plugin-sdk/provider-model-shared";
import manifest from "./sunclaw.plugin.json" with { type: "json" };

export function buildBytePlusProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "byteplus",
    catalog: manifest.modelCatalog.providers.byteplus,
  });
}

export function buildBytePlusCodingProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "byteplus-plan",
    catalog: manifest.modelCatalog.providers["byteplus-plan"],
  });
}
