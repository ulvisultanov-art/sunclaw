export type SunClawAgentSessionSkillSourceAugmentation = never;

declare module "sunclaw/plugin-sdk/agent-sessions" {
  interface Skill {
    // SunClaw relies on the source identifier returned by skill loaders.
    source: string;
  }
}
