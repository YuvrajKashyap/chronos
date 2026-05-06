import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { AdminTimerState } from "@/lib/chronos/admin-dashboard";
import { transformPublicDashboardToSkills, type PublicLikeSkill } from "@/lib/chronos/transform-dashboard";

export function getAdminActiveSessionCount(state: AdminTimerState | null) {
  return state?.active_session ? 1 : 0;
}

export function transformAdminDashboardToSkills(state: AdminTimerState): ChronosSkill[] {
  const publicLikeSkills: PublicLikeSkill[] = state.skills
    .filter((skill) => !skill.is_downtime)
    .map((skill) => ({
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      icon_key: skill.icon_key,
      accent_key: skill.accent_key,
      accent_color: skill.accent_color,
      visibility: skill.visibility,
      sort_order: skill.sort_order,
      lifetime_seconds: skill.lifetime_seconds,
      weekly_target_seconds: skill.weekly_target_seconds,
      target_sessions_per_week: skill.target_sessions_per_week,
      priority_weight: skill.priority_weight,
      goal_note: skill.goal_note,
      active_session_started_at: skill.active_session_started_at,
      current_active_elapsed_seconds: skill.current_active_elapsed_seconds,
    }));

  return transformPublicDashboardToSkills({ skills: publicLikeSkills });
}
