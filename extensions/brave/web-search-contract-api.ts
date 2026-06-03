import type { WebSearchProviderPlugin } from "sunclaw/plugin-sdk/provider-web-search-config-contract";
import { buildBraveWebSearchProviderBase } from "./web-search-shared.js";

export function createBraveWebSearchProvider(): WebSearchProviderPlugin {
  return {
    ...buildBraveWebSearchProviderBase(),
    createTool: () => null,
  };
}
