import {
  getRuntimeConfig,
  getRuntimeConfigSourceSnapshot,
  type SunClawConfig,
} from "../config/config.js";

export function loadBrowserConfigForRuntimeRefresh(): SunClawConfig {
  return getRuntimeConfigSourceSnapshot() ?? getRuntimeConfig();
}
