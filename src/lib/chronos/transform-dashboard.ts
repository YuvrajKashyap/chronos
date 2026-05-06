import type { ChronosSkill } from "@/lib/chronos-sample-data";
import { formatSecondsAsTimer } from "@/lib/chronos/format-time";
import { resolveSkillStyle } from "@/lib/chronos/skill-style-options";
import type { PublicDashboardPayload, PublicDashboardSkill } from "@/lib/chronos/public-dashboard";

export type PublicLikeSkill = PublicDashboardSkill;

export function hasUsefulPublicDashboardData(payload: PublicDashboardPayload | null) {
  return Array.isArray(payload?.skills) && payload.skills.length > 0;
}

export function getPublicActiveSessionCount(payload: PublicDashboardPayload | null) {
  if (!payload?.skills?.length) {
    return payload?.active_session ? 1 : 0;
  }

  return payload.skills.filter((skill) => {
    return Boolean(skill.active_session_started_at || skill.current_active_elapsed_seconds);
  }).length;
}

export function transformPublicDashboardToSkills(payload: PublicDashboardPayload): ChronosSkill[] {
  return [...(payload.skills ?? [])]
    .sort((a, b) => {
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.name ?? "").localeCompare(b.name ?? "");
    })
    .map((skill) => {
      const style = resolveSkillStyle({
        accentColor: skill.accent_color,
        accentKey: skill.accent_key,
        iconKey: skill.icon_key,
        name: skill.name,
        slug: skill.slug,
      });
      const isActive = Boolean(skill.active_session_started_at || skill.current_active_elapsed_seconds);
      const initialElapsedSeconds = skill.current_active_elapsed_seconds ?? 0;

      return {
        id: skill.id ?? skill.slug ?? skill.name ?? "skill",
        slug: skill.slug ?? undefined,
        title: skill.name ?? skill.slug ?? "Skill",
        iconKey: skill.icon_key ?? undefined,
        icon: style.icon,
        iconEmoji: style.emoji,
        accent: style.accent,
        accentColor: style.accentColor,
        accentRgb: style.accentRgb,
        accentKey: skill.accent_key ?? style.accent,
        visibility: skill.visibility ?? undefined,
        isActive,
        badge: isActive ? "LIVE" : undefined,
        label: isActive ? "ELAPSED TIME" : "LIFETIME TOTAL",
        value: formatSecondsAsTimer(isActive ? initialElapsedSeconds : skill.lifetime_seconds),
        buttonLabel: isActive ? "Stop" : "Start",
        motif: style.motif,
        activeStartedAt: skill.active_session_started_at ?? undefined,
        initialElapsedSeconds,
        lifetimeSeconds: skill.lifetime_seconds,
        weeklyTargetSeconds: skill.weekly_target_seconds,
        targetSessionsPerWeek: skill.target_sessions_per_week,
        priorityWeight: skill.priority_weight,
        goalNote: skill.goal_note,
      };
    });
}
