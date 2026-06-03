/**
 * Standalone MCP server for selected built-in SunClaw tools.
 *
 * Run via: node --import tsx src/mcp/sunclaw-tools-serve.ts
 * Or: bun src/mcp/sunclaw-tools-serve.ts
 */
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createCronTool } from "../agents/tools/cron-tool.js";
import { formatErrorMessage } from "../infra/errors.js";
import { connectToolsMcpServerToStdio, createToolsMcpServer } from "./tools-stdio-server.js";

export function resolveSunClawToolsForMcp(): AnyAgentTool[] {
  return [createCronTool()];
}

function createSunClawToolsMcpServer(
  params: {
    tools?: AnyAgentTool[];
  } = {},
): Server {
  const tools = params.tools ?? resolveSunClawToolsForMcp();
  return createToolsMcpServer({ name: "sunclaw-tools", tools });
}

async function serveSunClawToolsMcp(): Promise<void> {
  const server = createSunClawToolsMcpServer();
  await connectToolsMcpServerToStdio(server);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  serveSunClawToolsMcp().catch((err: unknown) => {
    process.stderr.write(`sunclaw-tools-serve: ${formatErrorMessage(err)}\n`);
    process.exit(1);
  });
}
