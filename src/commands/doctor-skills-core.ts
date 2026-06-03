import type { SunClawConfig } from "../config/types.sunclaw.js";
import type { SkillStatusEntry, SkillStatusReport } from "../skills/discovery/status.js";

export function collectUnavailableAgentSkills(report: SkillStatusReport): SkillStatusEntry[] {
  return report.skills.filter(
    (skill) =>
      !skill.eligible &&
      !skill.disabled &&
      !skill.blockedByAllowlist &&
      !skill.blockedByAgentFilter,
  );
}

export function disableUnavailableSkillsInConfig(
  config: SunClawConfig,
  skills: readonly SkillStatusEntry[],
): SunClawConfig {
  if (skills.length === 0) {
    return config;
  }
  const entries = { ...config.skills?.entries };
  for (const skill of skills) {
    entries[skill.skillKey] = {
      ...entries[skill.skillKey],
      enabled: false,
    };
  }
  return {
    ...config,
    skills: {
      ...config.skills,
      entries,
    },
  };
}
