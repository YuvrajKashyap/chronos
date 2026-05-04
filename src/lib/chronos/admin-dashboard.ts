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
  started_at: string;
  ended_at?: string | null;
  source: "timer" | "manual" | "system";
  is_private: boolean;
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
  recent_sessions: AdminRecentSession[];
};

export async function getAdminTimerState(): Promise<{ state: AdminTimerState | null; error: string | null }> {
  if (!hasChronosSupabaseEnv()) {
    return { state: null, error: "Supabase environment variables are not configured." };
  }

  try {
    const supabase = await createChronosServerClient();
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
