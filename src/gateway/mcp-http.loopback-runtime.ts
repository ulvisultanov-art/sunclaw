type McpLoopbackRuntime = {
  port: number;
  ownerToken: string;
  nonOwnerToken: string;
};

let activeRuntime: McpLoopbackRuntime | undefined;

export function getActiveMcpLoopbackRuntime(): McpLoopbackRuntime | undefined {
  return activeRuntime ? { ...activeRuntime } : undefined;
}

export function setActiveMcpLoopbackRuntime(runtime: McpLoopbackRuntime): void {
  activeRuntime = { ...runtime };
}

export function resolveMcpLoopbackBearerToken(
  runtime: McpLoopbackRuntime,
  senderIsOwner: boolean,
): string {
  return senderIsOwner ? runtime.ownerToken : runtime.nonOwnerToken;
}

export function clearActiveMcpLoopbackRuntimeByOwnerToken(ownerToken: string): void {
  if (activeRuntime?.ownerToken === ownerToken) {
    activeRuntime = undefined;
  }
}

export function createMcpLoopbackServerConfig(port: number) {
  return {
    mcpServers: {
      sunclaw: {
        type: "http",
        url: `http://127.0.0.1:${port}/mcp`,
        headers: {
          Authorization: "Bearer ${SUNCLAW_MCP_TOKEN}",
          "x-session-key": "${SUNCLAW_MCP_SESSION_KEY}",
          "x-sunclaw-agent-id": "${SUNCLAW_MCP_AGENT_ID}",
          "x-sunclaw-account-id": "${SUNCLAW_MCP_ACCOUNT_ID}",
          "x-sunclaw-message-channel": "${SUNCLAW_MCP_MESSAGE_CHANNEL}",
          "x-sunclaw-current-channel-id": "${SUNCLAW_MCP_CURRENT_CHANNEL_ID}",
          "x-sunclaw-current-thread-ts": "${SUNCLAW_MCP_CURRENT_THREAD_TS}",
          "x-sunclaw-current-message-id": "${SUNCLAW_MCP_CURRENT_MESSAGE_ID}",
          "x-sunclaw-current-inbound-audio": "${SUNCLAW_MCP_CURRENT_INBOUND_AUDIO}",
          "x-sunclaw-inbound-event-kind": "${SUNCLAW_MCP_INBOUND_EVENT_KIND}",
          "x-sunclaw-source-reply-delivery-mode": "${SUNCLAW_MCP_SOURCE_REPLY_DELIVERY_MODE}",
        },
      },
    },
  };
}
