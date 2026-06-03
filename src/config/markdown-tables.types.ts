import type { MarkdownTableMode } from "./types.base.js";
import type { SunClawConfig } from "./types.sunclaw.js";

export type ResolveMarkdownTableModeParams = {
  cfg?: Partial<SunClawConfig>;
  channel?: string | null;
  accountId?: string | null;
};

export type ResolveMarkdownTableMode = (
  params: ResolveMarkdownTableModeParams,
) => MarkdownTableMode;
