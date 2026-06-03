import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let originalTestFileLog: string | undefined;
let originalSunClawLogLevel: string | undefined;
let logging: typeof import("../logging.js");

beforeAll(async () => {
  logging = await import("../logging.js");
});

beforeEach(() => {
  originalTestFileLog = process.env.SUNCLAW_TEST_FILE_LOG;
  originalSunClawLogLevel = process.env.SUNCLAW_LOG_LEVEL;
  delete process.env.SUNCLAW_TEST_FILE_LOG;
  delete process.env.SUNCLAW_LOG_LEVEL;
  logging.resetLogger();
  logging.setLoggerOverride(null);
});

afterEach(() => {
  if (originalTestFileLog === undefined) {
    delete process.env.SUNCLAW_TEST_FILE_LOG;
  } else {
    process.env.SUNCLAW_TEST_FILE_LOG = originalTestFileLog;
  }
  if (originalSunClawLogLevel === undefined) {
    delete process.env.SUNCLAW_LOG_LEVEL;
  } else {
    process.env.SUNCLAW_LOG_LEVEL = originalSunClawLogLevel;
  }
  logging.resetLogger();
  logging.setLoggerOverride(null);
  logging.setLoggerConfigLoaderForTests();
  vi.restoreAllMocks();
});

describe("getResolvedLoggerSettings", () => {
  it("uses a silent fast path in default Vitest mode without config reads", () => {
    const readLoggingConfig = vi.fn(() => undefined);
    logging.setLoggerConfigLoaderForTests(readLoggingConfig);

    const settings = logging.getResolvedLoggerSettings();

    expect(settings.level).toBe("silent");
    expect(readLoggingConfig).not.toHaveBeenCalled();
  });

  it("reads logging config when test file logging is explicitly enabled", () => {
    process.env.SUNCLAW_TEST_FILE_LOG = "1";
    logging.setLoggerConfigLoaderForTests(() => ({
      level: "debug",
      file: "/tmp/sunclaw-configured.log",
      maxFileBytes: 2048,
    }));

    const settings = logging.getResolvedLoggerSettings();

    expect(settings.level).toBe("debug");
    expect(settings.file).toBe("/tmp/sunclaw-configured.log");
    expect(settings.maxFileBytes).toBe(2048);
  });

  it("uses defaults when no logging config is available", () => {
    process.env.SUNCLAW_TEST_FILE_LOG = "1";
    logging.setLoggerConfigLoaderForTests(() => undefined);

    const settings = logging.getResolvedLoggerSettings();

    expect(settings.level).toBe("info");
    expect(settings.file).toContain(path.join(".artifacts", "test-logs"));
    expect(path.basename(settings.file)).toMatch(/^sunclaw-vitest-\d+-\d{4}-\d{2}-\d{2}\.log$/);
    expect(settings.file).not.toBe(
      `/tmp/sunclaw/sunclaw-${new Date().toISOString().slice(0, 10)}.log`,
    );
  });
});
