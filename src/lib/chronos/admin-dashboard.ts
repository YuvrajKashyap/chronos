import { hasChronosSupabaseEnv } from "@/lib/supabase/env";
import { createChronosServerClient } from "@/lib/supabase/server";

export type AdminSkill = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon_key?: string | null;
  accent_key?: string | null;
  accent_color?: string | null;
  visibility: "public" | "private";
  is_downtime: boolean;
  sort_order: number;
  archived_at?: string | null;
  lifetime_seconds: number;
  weekly_target_seconds?: number | null;
  target_sessions_per_week?: number | null;
  priority_weight?: number | null;
  goal_note?: string | null;
  active_session_started_at?: string | null;
  current_active_elapsed_seconds?: number | null;
};

export type AdminActiveSession = {
  id: string;
  skill_id: string;
  skill_slug: string;
  skill_name: string;
  is_downtime: boolean;
  visibility: "public" | "private";
  started_at: string;
  is_private: boolean;
  current_active_elapsed_seconds: number;
};

export type AdminRecentSession = {
  id: string;
  skill_id: string;
  skill_name: string;
  is_downtime?: boolean | null;
  started_at: string;
  ended_at?: string | null;
  source: "timer" | "manual" | "system";
  is_private: boolean;
  counts_toward_lifetime?: boolean | null;
  duration_seconds: number;
  planned_seconds?: number | null;
  quality_score?: number | null;
  energy_score?: number | null;
  focus_score?: number | null;
  outcome?: string | null;
  project_key?: string | null;
  tag_names?: string[] | null;
  interruption_count?: number | null;
  paused_seconds?: number | null;
};

export type AdminPendingSession = {
  id: string;
  skill_id: string;
  skill_name: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
};

export type AdminTimerState = {
  success: boolean;
  error?: string | null;
  generated_at?: string;
  user?: {
    id: string;
    email: string;
    display_name?: string | null;
    access_status: string;
    is_owner: boolean;
  };
  skills: AdminSkill[];
  active_session?: AdminActiveSession | null;
  idle_session?: {
    started_at: string;
    current_idle_elapsed_seconds: number;
  } | null;
  pending_sessions?: AdminPendingSession[];
  recent_sessions: AdminRecentSession[];
};

function isMissingRpcFunction(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("could not find the function") || normalized.includes("schema cache");
}

async function ensureDowntimeClock(client: Awaited<ReturnType<typeof createChronosServerClient>>) {
  const startedAt = new Date().toISOString();
  const { error } = await client.rpc("ensure_downtime_timer", { p_started_at: startedAt });

  if (!error) {
    return;
  }

  if (!isMissingRpcFunction(error.message)) {
    return;
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return;
  }

  await client.rpc("start_idle_window", { p_user_id: user.id, p_started_at: startedAt });
}

export async function getAdminTimerState(): Promise<{ state: AdminTimerState | null; error: string | null }> {
  if (!hasChronosSupabaseEnv()) {
    return { state: null, error: "Supabase environment variables are not configured." };
  }

  try {
    const supabase = await createChronosServerClient();
    await ensureDowntimeClock(supabase);

    const { data, error } = await supabase.rpc("get_admin_timer_state");

    if (error) {
      return { state: null, error: error.message };
    }

    const state = data as AdminTimerState;

    if (state?.success === false) {
      return { state: null, error: state.error ?? "Unable to load Chronos admin timer state." };
    }

    return { state, error: null };
  } catch (error) {
    return {
      state: null,
      error: error instanceof Error ? error.message : "Unable to load Chronos admin timer state.",
    };
  }
}
