const COMMON_LIVE_ENV_NAMES = [
  "SUNCLAW_AGENT_RUNTIME",
  "SUNCLAW_CONFIG_PATH",
  "SUNCLAW_GATEWAY_TOKEN",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "SUNCLAW_SKIP_BROWSER_CONTROL_SERVER",
  "SUNCLAW_SKIP_CANVAS_HOST",
  "SUNCLAW_SKIP_CHANNELS",
  "SUNCLAW_SKIP_CRON",
  "SUNCLAW_SKIP_GMAIL_WATCHER",
  "SUNCLAW_STATE_DIR",
] as const;

export type LiveEnvSnapshot = Record<string, string | undefined>;

export function snapshotLiveEnv(extraNames: readonly string[] = []): LiveEnvSnapshot {
  const snapshot: LiveEnvSnapshot = {};
  for (const name of [...COMMON_LIVE_ENV_NAMES, ...extraNames]) {
    snapshot[name] = process.env[name];
  }
  return snapshot;
}

export function restoreLiveEnv(snapshot: LiveEnvSnapshot): void {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}
