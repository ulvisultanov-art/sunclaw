export type { AcpProvenanceMode, AcpServerOptions, AcpSession } from "@sunclaw/acp-core/types";
export { normalizeAcpProvenanceMode } from "@sunclaw/acp-core/types";
import { VERSION } from "../version.js";

export const ACP_AGENT_INFO = {
  name: "sunclaw-acp",
  title: "SunClaw ACP Gateway",
  version: VERSION,
};
