import { resolveChannelStreamingPreviewChunk } from "sunclaw/plugin-sdk/channel-outbound";
import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import { resolveTextChunkLimit } from "sunclaw/plugin-sdk/reply-chunking";
import { resolveAccountEntry } from "sunclaw/plugin-sdk/routing";
import { normalizeAccountId } from "sunclaw/plugin-sdk/routing";
import { TELEGRAM_TEXT_CHUNK_LIMIT } from "./outbound-adapter.js";

const DEFAULT_TELEGRAM_DRAFT_STREAM_MIN = 200;
const DEFAULT_TELEGRAM_DRAFT_STREAM_MAX = 800;

export function resolveTelegramDraftStreamingChunking(
  cfg: SunClawConfig | undefined,
  accountId?: string | null,
): {
  minChars: number;
  maxChars: number;
  breakPreference: "paragraph" | "newline" | "sentence";
} {
  const textLimit = resolveTextChunkLimit(cfg, "telegram", accountId, {
    fallbackLimit: TELEGRAM_TEXT_CHUNK_LIMIT,
  });
  const normalizedAccountId = normalizeAccountId(accountId);
  const accountCfg = resolveAccountEntry(cfg?.channels?.telegram?.accounts, normalizedAccountId);
  const draftCfg =
    resolveChannelStreamingPreviewChunk(accountCfg) ??
    resolveChannelStreamingPreviewChunk(cfg?.channels?.telegram);

  const maxRequested = Math.max(
    1,
    Math.floor(draftCfg?.maxChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MAX),
  );
  const maxChars = Math.max(1, Math.min(maxRequested, textLimit));
  const minRequested = Math.max(
    1,
    Math.floor(draftCfg?.minChars ?? DEFAULT_TELEGRAM_DRAFT_STREAM_MIN),
  );
  const minChars = Math.min(minRequested, maxChars);
  const breakPreference =
    draftCfg?.breakPreference === "newline" || draftCfg?.breakPreference === "sentence"
      ? draftCfg.breakPreference
      : "paragraph";
  return { minChars, maxChars, breakPreference };
}
