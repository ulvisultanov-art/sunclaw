import { configureAcpErrorRedactor } from "@sunclaw/acp-core";
import { redactSensitiveText } from "../../logging/redact.js";

configureAcpErrorRedactor(redactSensitiveText);

export * from "@sunclaw/acp-core/runtime/errors";
