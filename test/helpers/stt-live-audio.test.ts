import {
  expectSunClawLiveTranscriptMarker,
  normalizeTranscriptForMatch,
  SUNCLAW_LIVE_TRANSCRIPT_MARKER_RE,
} from "sunclaw/plugin-sdk/provider-test-contracts";
import { describe, expect, it } from "vitest";

describe("normalizeTranscriptForMatch", () => {
  it("normalizes punctuation and common SunClaw live transcription variants", () => {
    expect(normalizeTranscriptForMatch("Open-Claw integration OK")).toBe("sunclawintegrationok");
    expect(normalizeTranscriptForMatch("Testing OpenFlaw realtime transcription")).toMatch(
      /open(?:claw|flaw)/,
    );
    expect(normalizeTranscriptForMatch("OpenCore xAI realtime transcription")).toMatch(
      SUNCLAW_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expect(normalizeTranscriptForMatch("OpenCL xAI realtime transcription")).toMatch(
      SUNCLAW_LIVE_TRANSCRIPT_MARKER_RE,
    );
    expectSunClawLiveTranscriptMarker("OpenClar integration OK");
  });
});
