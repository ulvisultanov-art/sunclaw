import { describe, expect, it } from "vitest";
import { SunClawSchema } from "./zod-schema.js";

describe("SunClawSchema talk validation", () => {
  it("accepts a positive integer talk.silenceTimeoutMs", () => {
    const result = SunClawSchema.safeParse({
      talk: {
        consultThinkingLevel: "low",
        consultFastMode: true,
        silenceTimeoutMs: 1500,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid talk.consultThinkingLevel", () => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          consultThinkingLevel: "turbo",
        },
      }),
    ).toThrow(/consultThinkingLevel/i);
  });

  it("accepts additional realtime Talk instructions", () => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          realtime: {
            provider: "openai",
            providers: {
              openai: {
                model: "gpt-realtime",
                speakerVoice: "alloy",
                speakerVoiceId: "voice-123",
              },
            },
            instructions: "Speak with crisp diction.",
            consultRouting: "force-agent-consult",
          },
        },
      }),
    ).not.toThrow();
  });

  it("rejects invalid realtime Talk consult routing", () => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          realtime: {
            consultRouting: "always",
          },
        },
      }),
    ).toThrow(/consultRouting/i);
  });

  it.each([
    ["boolean", true],
    ["string", "1500"],
    ["float", 1500.5],
  ])("rejects %s talk.silenceTimeoutMs", (_label, value) => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          silenceTimeoutMs: value,
        },
      }),
    ).toThrow(/silenceTimeoutMs|number|integer/i);
  });

  it("rejects talk.provider when it does not match talk.providers", () => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          provider: "acme",
          providers: {
            elevenlabs: {
              voiceId: "voice-123",
            },
          },
        },
      }),
    ).toThrow(/talk\.provider|talk\.providers|missing "acme"/i);
  });

  it("rejects multi-provider talk config without talk.provider", () => {
    expect(() =>
      SunClawSchema.parse({
        talk: {
          providers: {
            acme: {
              voiceId: "voice-acme",
            },
            elevenlabs: {
              voiceId: "voice-eleven",
            },
          },
        },
      }),
    ).toThrow(/talk\.provider|required/i);
  });
});
