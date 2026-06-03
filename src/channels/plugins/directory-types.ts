import type { SunClawConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: SunClawConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};
