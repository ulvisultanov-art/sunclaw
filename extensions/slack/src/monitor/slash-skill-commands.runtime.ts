import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "sunclaw/plugin-sdk/command-auth-native";

type ListSkillCommandsForAgents =
  typeof import("sunclaw/plugin-sdk/command-auth-native").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
