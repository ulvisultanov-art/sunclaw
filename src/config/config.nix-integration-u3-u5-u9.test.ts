import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GATEWAY_PORT,
  resolveConfigPathCandidate,
  resolveGatewayPort,
  resolveIsNixMode,
  resolveStateDir,
} from "./config.js";
import { withTempHome } from "./test-helpers.js";

vi.unmock("../version.js");

function envWith(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  // Hermetic env: don't inherit process.env because other tests may mutate it.
  return { ...overrides };
}

describe("Nix integration (U3, U5, U9)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("U3: isNixMode env var detection", () => {
    it("isNixMode is false when SUNCLAW_NIX_MODE is not set", () => {
      expect(resolveIsNixMode(envWith({ SUNCLAW_NIX_MODE: undefined }))).toBe(false);
    });

    it("isNixMode is false when SUNCLAW_NIX_MODE is empty", () => {
      expect(resolveIsNixMode(envWith({ SUNCLAW_NIX_MODE: "" }))).toBe(false);
    });

    it("isNixMode is false when SUNCLAW_NIX_MODE is not '1'", () => {
      expect(resolveIsNixMode(envWith({ SUNCLAW_NIX_MODE: "true" }))).toBe(false);
    });

    it("isNixMode is true when SUNCLAW_NIX_MODE=1", () => {
      expect(resolveIsNixMode(envWith({ SUNCLAW_NIX_MODE: "1" }))).toBe(true);
    });
  });

  describe("U5: CONFIG_PATH and STATE_DIR env var overrides", () => {
    it("STATE_DIR defaults to ~/.sunclaw when env not set", () => {
      expect(resolveStateDir(envWith({ SUNCLAW_STATE_DIR: undefined }))).toMatch(/\.sunclaw$/);
    });

    it("STATE_DIR respects SUNCLAW_STATE_DIR override", () => {
      expect(resolveStateDir(envWith({ SUNCLAW_STATE_DIR: "/custom/state/dir" }))).toBe(
        path.resolve("/custom/state/dir"),
      );
    });

    it("STATE_DIR respects SUNCLAW_HOME when state override is unset", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveStateDir(envWith({ SUNCLAW_HOME: customHome, SUNCLAW_STATE_DIR: undefined })),
      ).toBe(path.join(path.resolve(customHome), ".sunclaw"));
    });

    it("CONFIG_PATH defaults to SUNCLAW_HOME/.sunclaw/sunclaw.json", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveConfigPathCandidate(
          envWith({
            SUNCLAW_HOME: customHome,
            SUNCLAW_CONFIG_PATH: undefined,
            SUNCLAW_STATE_DIR: undefined,
          }),
        ),
      ).toBe(path.join(path.resolve(customHome), ".sunclaw", "sunclaw.json"));
    });

    it("CONFIG_PATH defaults to ~/.sunclaw/sunclaw.json when env not set", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ SUNCLAW_CONFIG_PATH: undefined, SUNCLAW_STATE_DIR: undefined }),
        ),
      ).toMatch(/\.sunclaw[\\/]sunclaw\.json$/);
    });

    it("CONFIG_PATH respects SUNCLAW_CONFIG_PATH override", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ SUNCLAW_CONFIG_PATH: "/nix/store/abc/sunclaw.json" }),
        ),
      ).toBe(path.resolve("/nix/store/abc/sunclaw.json"));
    });

    it("CONFIG_PATH expands ~ in SUNCLAW_CONFIG_PATH override", async () => {
      await withTempHome(async (home) => {
        expect(
          resolveConfigPathCandidate(
            envWith({ SUNCLAW_HOME: home, SUNCLAW_CONFIG_PATH: "~/.sunclaw/custom.json" }),
            () => home,
          ),
        ).toBe(path.join(home, ".sunclaw", "custom.json"));
      });
    });

    it("CONFIG_PATH uses STATE_DIR when only state dir is overridden", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ SUNCLAW_STATE_DIR: "/custom/state", SUNCLAW_TEST_FAST: "1" }),
          () => path.join(path.sep, "tmp", "sunclaw-config-home"),
        ),
      ).toBe(path.join(path.resolve("/custom/state"), "sunclaw.json"));
    });
  });

  describe("U6: gateway port resolution", () => {
    it("uses default when env and config are unset", () => {
      expect(resolveGatewayPort({}, envWith({ SUNCLAW_GATEWAY_PORT: undefined }))).toBe(
        DEFAULT_GATEWAY_PORT,
      );
    });

    it("prefers SUNCLAW_GATEWAY_PORT over config", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19002 } },
          envWith({ SUNCLAW_GATEWAY_PORT: "19001" }),
        ),
      ).toBe(19001);
    });

    it("falls back to config when env is invalid", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19003 } },
          envWith({ SUNCLAW_GATEWAY_PORT: "nope" }),
        ),
      ).toBe(19003);
    });
  });
});
