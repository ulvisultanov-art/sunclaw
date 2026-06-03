import { resolveChannelGroupRequireMention } from "sunclaw/plugin-sdk/channel-policy";
import { resolveExactLineGroupConfigKey, type SunClawConfig } from "./channel-api.js";

type LineGroupContext = {
  cfg: SunClawConfig;
  accountId?: string | null;
  groupId?: string | null;
};

export function resolveLineGroupRequireMention(params: LineGroupContext): boolean {
  const exactGroupId = resolveExactLineGroupConfigKey({
    cfg: params.cfg,
    accountId: params.accountId,
    groupId: params.groupId,
  });
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "line",
    groupId: exactGroupId ?? params.groupId,
    accountId: params.accountId,
  });
}
