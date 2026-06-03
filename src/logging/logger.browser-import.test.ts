import { importFreshModule } from "sunclaw/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredSunClawTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredSunClawTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredSunClawTmpDir =
    params?.resolvePreferredSunClawTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredSunClawTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-sunclaw-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-sunclaw-dir.js")>(
      "../infra/tmp-sunclaw-dir.js",
    );
    return {
      ...actual,
      resolvePreferredSunClawTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredSunClawTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-sunclaw-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredSunClawTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredSunClawTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/sunclaw");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/sunclaw/sunclaw.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredSunClawTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toStrictEqual({
      level: "silent",
      file: "/tmp/sunclaw/sunclaw.log",
      maxFileBytes: 100 * 1024 * 1024,
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(module.getLogger().info("browser-safe")).toBeUndefined();
    expect(resolvePreferredSunClawTmpDir).not.toHaveBeenCalled();
  });
});
