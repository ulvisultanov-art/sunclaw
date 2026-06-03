import type { PluginRuntime } from "sunclaw/plugin-sdk/core";
import { createPluginRuntimeStore } from "sunclaw/plugin-sdk/runtime-store";

const {
  clearRuntime: clearIMessageRuntime,
  getRuntime: getIMessageRuntime,
  setRuntime: setIMessageRuntime,
  tryGetRuntime: getOptionalIMessageRuntime,
} = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "imessage",
  errorMessage: "iMessage runtime not initialized",
});
export { clearIMessageRuntime, getIMessageRuntime, getOptionalIMessageRuntime, setIMessageRuntime };
