import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MAX_TIMER_TIMEOUT_MS } from "./shared/number-coercion.js";
import { withTempDir } from "./test-helpers/temp-dir.js";
import {
  ensureDir,
  resolveConfigDir,
  resolveHomeDir,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
} from "./utils.js";

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDir({ prefix: "sunclaw-test-" }, async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    try {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clamps oversized sleep delays before scheduling", async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    try {
      const promise = sleep(Number.MAX_SAFE_INTEGER);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), MAX_TIMER_TIMEOUT_MS);

      vi.advanceTimersByTime(MAX_TIMER_TIMEOUT_MS);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      setTimeoutSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.sunclaw when legacy dir is missing", async () => {
    await withTempDir({ prefix: "sunclaw-config-dir-" }, async (root) => {
      const newDir = path.join(root, ".sunclaw");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("expands SUNCLAW_STATE_DIR using the provided env", () => {
    const env = {
      HOME: "/tmp/sunclaw-home",
      SUNCLAW_STATE_DIR: "~/state",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/sunclaw-home", "state"));
  });

  it("falls back to the config file directory when only SUNCLAW_CONFIG_PATH is set", () => {
    const env = {
      HOME: "/tmp/sunclaw-home",
      SUNCLAW_CONFIG_PATH: "~/profiles/dev/sunclaw.json",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/sunclaw-home", "profiles", "dev"));
  });
});

describe("resolveHomeDir", () => {
  it("prefers SUNCLAW_HOME over HOME", () => {
    vi.stubEnv("SUNCLAW_HOME", "/srv/sunclaw-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(resolveHomeDir()).toBe(path.resolve("/srv/sunclaw-home"));
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("shortenHomePath", () => {
  it("uses $SUNCLAW_HOME prefix when SUNCLAW_HOME is set", () => {
    vi.stubEnv("SUNCLAW_HOME", "/srv/sunclaw-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(shortenHomePath(`${path.resolve("/srv/sunclaw-home")}/.sunclaw/sunclaw.json`)).toBe(
        "$SUNCLAW_HOME/.sunclaw/sunclaw.json",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("shortenHomeInString", () => {
  it("uses $SUNCLAW_HOME replacement when SUNCLAW_HOME is set", () => {
    vi.stubEnv("SUNCLAW_HOME", "/srv/sunclaw-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(
        shortenHomeInString(`config: ${path.resolve("/srv/sunclaw-home")}/.sunclaw/sunclaw.json`),
      ).toBe("config: $SUNCLAW_HOME/.sunclaw/sunclaw.json");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~", {}, () => "/Users/thoffman")).toBe(path.resolve("/Users/thoffman"));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/sunclaw", {}, () => "/Users/thoffman")).toBe(
      path.resolve("/Users/thoffman", "sunclaw"),
    );
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers SUNCLAW_HOME for tilde expansion", () => {
    vi.stubEnv("SUNCLAW_HOME", "/srv/sunclaw-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(resolveUserPath("~/sunclaw")).toBe(path.resolve("/srv/sunclaw-home", "sunclaw"));
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("uses the provided env for tilde expansion", () => {
    const env = {
      HOME: "/tmp/sunclaw-home",
      SUNCLAW_HOME: "/srv/sunclaw-home",
    } as NodeJS.ProcessEnv;

    expect(resolveUserPath("~/sunclaw", env)).toBe(path.resolve("/srv/sunclaw-home", "sunclaw"));
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
