import { describe, expect, it } from "vitest";
import { resolveEmojiAndHomepage } from "./entry-metadata.js";

describe("shared/entry-metadata", () => {
  it("prefers metadata emoji and homepage when present", () => {
    expect(
      resolveEmojiAndHomepage({
        metadata: { emoji: "🦀", homepage: " https://docs.sunclaw.complex.az " },
        frontmatter: { emoji: "🙂", homepage: "https://example.com" },
      }),
    ).toEqual({
      emoji: "🦀",
      homepage: "https://docs.sunclaw.complex.az",
    });
  });

  it("keeps metadata precedence even when metadata values are blank", () => {
    expect(
      resolveEmojiAndHomepage({
        metadata: { emoji: "", homepage: "   " },
        frontmatter: { emoji: "🙂", homepage: "https://example.com" },
      }),
    ).toStrictEqual({});
  });

  it("falls back through frontmatter homepage aliases and drops blanks", () => {
    expect(
      resolveEmojiAndHomepage({
        frontmatter: { emoji: "🙂", website: " https://docs.sunclaw.complex.az " },
      }),
    ).toEqual({
      emoji: "🙂",
      homepage: "https://docs.sunclaw.complex.az",
    });
    expect(
      resolveEmojiAndHomepage({
        metadata: { homepage: "   " },
        frontmatter: { url: "   " },
      }),
    ).toStrictEqual({});
    expect(
      resolveEmojiAndHomepage({
        frontmatter: { url: " https://docs.sunclaw.complex.az/install " },
      }),
    ).toEqual({
      homepage: "https://docs.sunclaw.complex.az/install",
    });
  });

  it("does not fall back once frontmatter homepage aliases are present but blank", () => {
    expect(
      resolveEmojiAndHomepage({
        frontmatter: {
          homepage: " ",
          website: "https://docs.sunclaw.complex.az",
          url: "https://docs.sunclaw.complex.az/install",
        },
      }),
    ).toStrictEqual({});
  });
});
