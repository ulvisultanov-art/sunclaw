import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#sunclaw",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#sunclaw",
      rawTarget: "#sunclaw",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "sunclaw-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "sunclaw-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "sunclaw-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "sunclaw-bot",
      rawTarget: "sunclaw-bot",
    });
  });
});
