import type { PluginRuntime } from "sunclaw/plugin-sdk/core";
import type { OpenKeyedStoreOptions } from "sunclaw/plugin-sdk/plugin-state-runtime";
import {
  createPluginStateKeyedStoreForTests,
  createPluginStateSyncKeyedStoreForTests,
  resetPluginStateStoreForTests,
} from "sunclaw/plugin-sdk/plugin-state-test-runtime";
import { resetQQBotRuntimeForTest, setQQBotRuntime } from "../bridge/runtime.js";

function stateEnv(stateDir: string, env?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...(env ?? process.env),
    SUNCLAW_STATE_DIR: stateDir,
  };
}

export function installQQBotRuntimeForStateTests(stateDir: string): void {
  resetPluginStateStoreForTests();
  setQQBotRuntime({
    version: "test",
    state: {
      resolveStateDir: () => stateDir,
      openKeyedStore: <T>(options: OpenKeyedStoreOptions) =>
        createPluginStateKeyedStoreForTests<T>("qqbot", {
          ...options,
          env: stateEnv(stateDir, options.env),
        }),
      openSyncKeyedStore: <T>(options: OpenKeyedStoreOptions) =>
        createPluginStateSyncKeyedStoreForTests<T>("qqbot", {
          ...options,
          env: stateEnv(stateDir, options.env),
        }),
      openChannelIngressQueue: () => {
        throw new Error("openChannelIngressQueue is not configured for QQBot state tests");
      },
    },
  } as unknown as PluginRuntime);
}

export function resetQQBotStateTestRuntime(): void {
  resetQQBotRuntimeForTest();
  resetPluginStateStoreForTests();
}
