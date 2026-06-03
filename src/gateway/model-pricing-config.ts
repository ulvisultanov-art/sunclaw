import type { SunClawConfig } from "../config/types.sunclaw.js";

export function isGatewayModelPricingEnabled(config: SunClawConfig): boolean {
  return config.models?.pricing?.enabled !== false;
}
