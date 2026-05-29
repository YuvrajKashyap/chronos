import { hasChronosSupabaseEnv } from "@/lib/supabase/env";
import { createChronosServerClient } from "@/lib/supabase/server";

export type PublicDashboardSkill = {
  id?: string;
  slug?: string;
  name?: string;
  icon_key?: string | null;
  accent_key?: string | null;
  accent_color?: string | null;
  visibility?: "public" | "private" | null;
  sort_order?: number | null;
  updated_at?: string | null;
  last_active_at?: string | null;
  lifetime_seconds?: number | null;
  weekly_target_seconds?: number | null;
  target_sessions_per_week?: number | null;
  priority_weight?: number | null;
  goal_note?: string | null;
  today_seconds?: number | null;
  week_seconds?: number | null;
  active_session_started_at?: string | null;
  current_active_elapsed_seconds?: number | null;
  next_milestone_seconds?: number | null;
};

export type PublicDashboardPayload = {
  generated_at?: string;
  owner?: {
    display_name?: string | null;
  } | null;
  active_session?: {
    id?: string;
    skill_id?: string;
    skill_slug?: string;
    skill_name?: string;
    started_at?: string;
    current_active_elapsed_seconds?: number;
  } | null;
  skills?: PublicDashboardSkill[];
  totals?: {
    today_seconds?: number | null;
    week_seconds?: number | null;
    lifetime_seconds?: number | null;
  };
  visibility?: Record<string, boolean>;
};

export type PublicDashboardResult = {
  payload: PublicDashboardPayload | null;
  error: string | null;
};

export async function getPublicDashboard(): Promise<PublicDashboardResult> {
  if (!hasChronosSupabaseEnv()) {
    return {
      payload: null,
      error: "Supabase environment variables are not configured.",
    };
  }

  try {
    const supabase = await createChronosServerClient();
    const { data, error } = await supabase.rpc("get_public_dashboard");

    if (error) {
      return { payload: null, error: error.message };
    }

    return { payload: data as PublicDashboardPayload, error: null };
  } catch (error) {
    return {
      payload: null,
      error: error instanceof Error ? error.message : "Unable to load public Chronos dashboard.",
    };
  }
}
