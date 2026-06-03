import { resolveApprovalOverGateway } from "sunclaw/plugin-sdk/approval-gateway-runtime";
import type { ExecApprovalReplyDecision } from "sunclaw/plugin-sdk/approval-reply-runtime";
import type { SunClawConfig } from "sunclaw/plugin-sdk/config-contracts";
import { isApprovalNotFoundError } from "sunclaw/plugin-sdk/error-runtime";

export { isApprovalNotFoundError };

export async function resolveIMessageApproval(params: {
  cfg: SunClawConfig;
  approvalId: string;
  decision: ExecApprovalReplyDecision;
  senderId?: string | null;
  gatewayUrl?: string;
}): Promise<void> {
  await resolveApprovalOverGateway({
    cfg: params.cfg,
    approvalId: params.approvalId,
    decision: params.decision,
    senderId: params.senderId,
    gatewayUrl: params.gatewayUrl,
    clientDisplayName: `iMessage approval (${params.senderId?.trim() || "unknown"})`,
  });
}
