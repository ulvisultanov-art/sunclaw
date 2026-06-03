import type { ModelCatalogProvider } from "@sunclaw/model-catalog-core/model-catalog-types";

export type SunClawProviderIndexPluginInstall = {
  clawhubSpec?: string;
  npmSpec?: string;
  defaultChoice?: "clawhub" | "npm";
  minHostVersion?: string;
  expectedIntegrity?: string;
};

export type SunClawProviderIndexPlugin = {
  id: string;
  package?: string;
  source?: string;
  install?: SunClawProviderIndexPluginInstall;
};

export type SunClawProviderIndexProviderAuthChoice = {
  method: string;
  choiceId: string;
  choiceLabel: string;
  choiceHint?: string;
  assistantPriority?: number;
  assistantVisibility?: "visible" | "manual-only";
  groupId?: string;
  groupLabel?: string;
  groupHint?: string;
  optionKey?: string;
  cliFlag?: string;
  cliOption?: string;
  cliDescription?: string;
  onboardingScopes?: readonly ("text-inference" | "image-generation" | "music-generation")[];
};

export type SunClawProviderIndexProvider = {
  id: string;
  name: string;
  plugin: SunClawProviderIndexPlugin;
  docs?: string;
  categories?: readonly string[];
  authChoices?: readonly SunClawProviderIndexProviderAuthChoice[];
  previewCatalog?: ModelCatalogProvider;
};

export type SunClawProviderIndex = {
  version: number;
  providers: Readonly<Record<string, SunClawProviderIndexProvider>>;
};
