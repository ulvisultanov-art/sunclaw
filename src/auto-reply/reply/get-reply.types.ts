import type { SunClawConfig } from "../../config/types.sunclaw.js";
import type { GetReplyOptions } from "../get-reply-options.types.js";
import type { ReplyPayload } from "../reply-payload.js";
import type { MsgContext } from "../templating.js";

export type GetReplyFromConfig = (
  ctx: MsgContext,
  opts?: GetReplyOptions,
  configOverride?: SunClawConfig,
) => Promise<ReplyPayload | ReplyPayload[] | undefined>;
