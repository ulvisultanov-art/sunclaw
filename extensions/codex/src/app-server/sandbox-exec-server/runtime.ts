import type { SandboxContext } from "sunclaw/plugin-sdk/sandbox";
import type { SunClawExecServer } from "./types.js";

export function requireBackend(
  execServer: SunClawExecServer,
): NonNullable<SandboxContext["backend"]> {
  const backend = execServer.sandbox.backend;
  if (!backend) {
    throw new Error("SunClaw sandbox backend is unavailable.");
  }
  return backend;
}

export function requireFsBridge(
  execServer: SunClawExecServer,
): NonNullable<SandboxContext["fsBridge"]> {
  const fsBridge = execServer.sandbox.fsBridge;
  if (!fsBridge) {
    throw new Error("Sandbox filesystem bridge is unavailable.");
  }
  return fsBridge;
}
