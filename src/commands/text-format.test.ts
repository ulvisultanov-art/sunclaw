import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("sunclaw", 16)).toBe("sunclaw");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("sunclaw-status-output", 10)).toBe("sunclaw-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
