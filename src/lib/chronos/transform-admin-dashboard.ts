import type { ChronosSkill } from "@/lib/chronos-sample-data";
import type { AdminTimerState } from "@/lib/chronos/admin-dashboard";
import {
  transformPublicDashboardToSkills,
  type DashboardSortMode,
  type PublicLikeSkill,
} from "@/lib/chronos/transform-dashboard";

export function getAdminActiveSessionCount(state: AdminTimerState | null) {
  return state?.active_session && !state.active_session.is_downtime ? 1 : 0;
}

export function getAdminIdleSession(state: AdminTimerState | null): AdminTimerState["idle_session"] {
  if (!state) {
    return null;
  }

  if (state.idle_session) {
    return state.idle_session;
  }

  const activeDowntimeSkill = state.skills.find(
    (skill) => skill.is_downtime && !skill.archived_at && skill.active_session_started_at,
  );

  if (activeDowntimeSkill?.active_session_started_at) {
    return {
      started_at: activeDowntimeSkill.active_session_started_at,
      current_idle_elapsed_seconds: Math.max(0, Math.floor(activeDowntimeSkill.current_active_elapsed_seconds ?? 0)),
    };
  }

  if (state.active_session?.is_downtime) {
    return {
      started_at: state.active_session.started_at,
      current_idle_elapsed_seconds: Math.max(0, Math.floor(state.active_session.current_active_elapsed_seconds ?? 0)),
    };
  }

  return null;
}

export function transformAdminDashboardToSkills(
  state: AdminTimerState,
  sortMode: DashboardSortMode = "custom",
): ChronosSkill[] {
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
      updated_at: skill.updated_at,
      last_active_at: skill.last_active_at,
      lifetime_seconds: skill.lifetime_seconds,
      active_session_started_at: skill.active_session_started_at,
      current_active_elapsed_seconds: skill.current_active_elapsed_seconds,
    }));

  return transformPublicDashboardToSkills({ skills: publicLikeSkills }, sortMode);
}
