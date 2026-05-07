"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

const ALLOWED_ACCENTS = new Set(["coral", "blue", "amber", "violet", "teal", "indigo"]);
const CUSTOM_ACCENT_PATTERN = /^custom-[0-9a-f]{6}$/i;

function getSafeNextPath(formData: FormData | null) {
  const nextPath = String(formData?.get("nextPath") ?? "/admin");

  return nextPath === "/" ? "/" : "/admin";
}

function redirectWithAdminError(message: string, nextPath: string) {
  redirect(`${nextPath}?error=${encodeURIComponent(message)}`);
}

function getRpcErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success === false &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

type TimerSessionPayload = {
  id?: string;
  skill_id?: string;
  started_at?: string;
  ended_at?: string | null;
};

export type SmoothStoppedSession = {
  id: string;
  skillId: string;
  skillName: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

export type SmoothTimerActionResult =
  | { success: true; session?: { id: string; skillId: string; startedAt: string } }
  | { success: false; error: string };

export type SmoothStopTimerActionResult =
  | { success: true; session: SmoothStoppedSession }
  | { success: false; error: string };

export type SkillReorderActionResult = { success: true } | { success: false; error: string };

type ChronosSupabaseClient = Awaited<ReturnType<typeof createChronosServerClient>>;
type ConfirmTimerResult = { success: true } | { success: false; error: string };
type UpdateSkillPayload = ReturnType<typeof getSkillFormPayload> & {
  goalNote: string;
  priorityWeight: number;
  targetSessionsPerWeek: number;
  weeklyTargetSeconds: number;
};

function getSessionPayload(data: unknown): TimerSessionPayload | null {
  if (!data || typeof data !== "object" || !("session" in data)) {
    return null;
  }

  const session = data.session;
  if (!session || typeof session !== "object") {
    return null;
  }

  return session as TimerSessionPayload;
}

function getDurationSeconds(startedAt?: string, endedAt?: string | null) {
  if (!startedAt || !endedAt) {
    return 0;
  }

  const duration = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  return Number.isFinite(duration) ? Math.max(0, duration) : 0;
}

function getSafeDurationOverride(durationSeconds: number | null | undefined) {
  if (durationSeconds === null || durationSeconds === undefined) {
    return null;
  }

  const duration = Math.floor(Number(durationSeconds));
  return Number.isFinite(duration) ? Math.max(0, duration) : null;
}

function getSkillFormPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const iconKey = String(formData.get("iconKey") ?? "sparkles").trim() || "sparkles";
  const requestedAccent = String(formData.get("accentKey") ?? "coral").trim();
  const visibility = String(formData.get("visibility") ?? "public") === "private" ? "private" : "public";

  return {
    accentKey: ALLOWED_ACCENTS.has(requestedAccent) || CUSTOM_ACCENT_PATTERN.test(requestedAccent) ? requestedAccent.toLowerCase() : "coral",
    iconKey,
    name,
    visibility,
  };
}

function getLifetimeSeconds(formData: FormData) {
  if (!formData.has("lifetimeHours") && !formData.has("lifetimeMinutes") && !formData.has("lifetimeSeconds")) {
    return null;
  }

  const hours = Math.max(0, Math.floor(Number(formData.get("lifetimeHours") ?? 0) || 0));
  const minutes = Math.min(59, Math.max(0, Math.floor(Number(formData.get("lifetimeMinutes") ?? 0) || 0)));
  const seconds = Math.min(59, Math.max(0, Math.floor(Number(formData.get("lifetimeSeconds") ?? 0) || 0)));

  return (hours * 3600) + (minutes * 60) + seconds;
}

function getWeeklyTargetSeconds(formData: FormData) {
  const hours = Math.max(0, Math.floor(Number(formData.get("weeklyTargetHours") ?? 0) || 0));
  const minutes = Math.min(59, Math.max(0, Math.floor(Number(formData.get("weeklyTargetMinutes") ?? 0) || 0)));

  return (hours * 3600) + (minutes * 60);
}

function getBoundedInteger(value: FormDataEntryValue | number | null | undefined, min: number, max: number, fallback: number | null) {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function isAlreadyResolvedDecision(message: string) {
  return message.toLowerCase().includes("no stopped timer is awaiting a lifetime decision");
}

function isMissingRpcSignature(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("could not find the function") || normalized.includes("schema cache");
}

async function confirmTimerSessionDecision(
  supabase: ChronosSupabaseClient,
  sessionId: string,
  countTowardsLifetime: boolean,
): Promise<ConfirmTimerResult> {
  const fullSignatureArgs = {
    p_session_id: sessionId,
    p_count_towards_lifetime: countTowardsLifetime,
    p_quality_score: null,
    p_energy_score: null,
    p_focus_score: null,
    p_outcome: null,
    p_project_key: null,
    p_tag_names: [],
    p_planned_seconds: null,
    p_interruption_count: 0,
    p_paused_seconds: 0,
  };
  const minimalSignatureArgs = {
    p_session_id: sessionId,
    p_count_towards_lifetime: countTowardsLifetime,
  };
  const errors: string[] = [];

  for (const args of [fullSignatureArgs, minimalSignatureArgs]) {
    const { data, error } = await supabase.rpc("confirm_timer_session", args);

    if (error) {
      errors.push(error.message);
      continue;
    }

    const message = getRpcErrorMessage(data, "Stopped session could not be updated.");
    if (data && typeof data === "object" && "success" in data && data.success === false) {
      return isAlreadyResolvedDecision(message) ? { success: true } : { success: false, error: message };
    }

    return { success: true };
  }

  const { data: updatedSession, error: updateError } = await supabase
    .schema("chronos")
    .from("sessions")
    .update({ counts_toward_lifetime: countTowardsLifetime })
    .eq("id", sessionId)
    .not("ended_at", "is", null)
    .is("counts_toward_lifetime", null)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { success: false, error: updateError.message || errors.at(0) || "Stopped session could not be updated." };
  }

  if (!updatedSession) {
    return { success: true };
  }

  return { success: true };
}

async function updateSkillDetails(
  supabase: ChronosSupabaseClient,
  skillId: string,
  payload: UpdateSkillPayload,
): Promise<{ success: true } | { success: false; error: string }> {
  const expandedArgs = {
    p_skill_id: skillId,
    p_name: payload.name,
    p_icon_key: payload.iconKey,
    p_accent_key: payload.accentKey,
    p_visibility: payload.visibility,
    p_weekly_target_seconds: payload.weeklyTargetSeconds,
    p_target_sessions_per_week: payload.targetSessionsPerWeek,
    p_priority_weight: payload.priorityWeight,
    p_goal_note: payload.goalNote,
  };

  const { data, error } = await supabase.rpc("update_skill", expandedArgs);

  if (!error) {
    const message = getRpcErrorMessage(data, "Dashboard card could not be updated.");
    if (data && typeof data === "object" && "success" in data && data.success === false) {
      return { success: false, error: message };
    }

    return { success: true };
  }

  if (!isMissingRpcSignature(error.message)) {
    return { success: false, error: error.message };
  }

  const { data: legacyData, error: legacyError } = await supabase.rpc("update_skill", {
    p_skill_id: skillId,
    p_name: payload.name,
    p_icon_key: payload.iconKey,
    p_accent_key: payload.accentKey,
    p_visibility: payload.visibility,
  });

  if (legacyError) {
    return { success: false, error: legacyError.message || error.message };
  }

  const legacyMessage = getRpcErrorMessage(legacyData, "Dashboard card could not be updated.");
  if (legacyData && typeof legacyData === "object" && "success" in legacyData && legacyData.success === false) {
    return { success: false, error: legacyMessage };
  }

  const { error: trackingError } = await supabase
    .schema("chronos")
    .from("skills")
    .update({
      weekly_target_seconds: payload.weeklyTargetSeconds,
      target_sessions_per_week: payload.targetSessionsPerWeek,
      priority_weight: payload.priorityWeight,
      goal_note: payload.goalNote || null,
    })
    .eq("id", skillId)
    .is("archived_at", null);

  if (trackingError && !trackingError.message.toLowerCase().includes("column")) {
    return { success: false, error: trackingError.message };
  }

  return { success: true };
}

export async function logoutFromChronos() {
  const supabase = await createChronosServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function logoutFromChronosToDashboard() {
  const supabase = await createChronosServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function startChronosTimer(formData: FormData) {
  const skillId = String(formData.get("skillId") ?? "");
  const nextPath = getSafeNextPath(formData);

  if (!skillId) {
    redirectWithAdminError("Choose a skill before starting a timer.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("start_timer", {
    p_skill_id: skillId,
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Timer could not be started.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function startChronosTimerSmooth(skillId: string, startedAt?: string): Promise<SmoothTimerActionResult> {
  if (!skillId) {
    return { success: false, error: "Choose a skill before starting a timer." };
  }

  try {
    const supabase = await createChronosServerClient();
    const { data, error } = await supabase.rpc("start_timer", {
      p_skill_id: skillId,
      p_started_at: startedAt ?? new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const message = getRpcErrorMessage(data, "Timer could not be started.");
    if (data && typeof data === "object" && "success" in data && data.success === false) {
      return { success: false, error: message };
    }

    const session = getSessionPayload(data);
    revalidatePath("/");
    revalidatePath("/admin");

    return {
      success: true,
      session:
        session?.id && session.skill_id && session.started_at
          ? {
              id: session.id,
              skillId: session.skill_id,
              startedAt: session.started_at,
            }
          : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Timer could not be started.",
    };
  }
}

export async function stopChronosTimer(formData: FormData) {
  const nextPath = getSafeNextPath(formData);
  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("stop_timer", {
    p_ended_at: new Date().toISOString(),
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Timer could not be stopped.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function stopChronosTimerSmooth(
  fallbackSkillName: string,
  endedAt?: string,
): Promise<SmoothStopTimerActionResult> {
  try {
    const supabase = await createChronosServerClient();
    const { data, error } = await supabase.rpc("stop_timer", {
      p_ended_at: endedAt ?? new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const message = getRpcErrorMessage(data, "Timer could not be stopped.");
    if (data && typeof data === "object" && "success" in data && data.success === false) {
      return { success: false, error: message };
    }

    const session = getSessionPayload(data);
    if (!session?.id || !session.skill_id || !session.started_at || !session.ended_at) {
      return { success: false, error: "Stopped timer details were unavailable." };
    }

    const { data: skill } = await supabase
      .schema("chronos")
      .from("skills")
      .select("name")
      .eq("id", session.skill_id)
      .maybeSingle();

    revalidatePath("/");
    revalidatePath("/admin");

    return {
      success: true,
      session: {
        id: session.id,
        skillId: session.skill_id,
        skillName:
          skill && typeof skill === "object" && "name" in skill && typeof skill.name === "string"
            ? skill.name
            : fallbackSkillName,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        durationSeconds: getDurationSeconds(session.started_at, session.ended_at),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Timer could not be stopped.",
    };
  }
}

async function applySessionDurationOverride(
  supabase: Awaited<ReturnType<typeof createChronosServerClient>>,
  sessionId: string,
  durationSeconds: number | null,
) {
  if (durationSeconds === null) {
    return null;
  }

  const { data: session, error: selectError } = await supabase
    .schema("chronos")
    .from("sessions")
    .select("started_at")
    .eq("id", sessionId)
    .is("counts_toward_lifetime", null)
    .maybeSingle();

  if (selectError) {
    return selectError.message;
  }

  if (!session?.started_at) {
    return "Stopped timer could not be adjusted.";
  }

  const startedAtMs = new Date(String(session.started_at)).getTime();
  if (!Number.isFinite(startedAtMs)) {
    return "Stopped timer start time could not be read.";
  }

  const endedAt = new Date(startedAtMs + (durationSeconds * 1000)).toISOString();
  const { error: updateError } = await supabase
    .schema("chronos")
    .from("sessions")
    .update({ ended_at: endedAt })
    .eq("id", sessionId)
    .is("counts_toward_lifetime", null);

  return updateError?.message ?? null;
}

export async function confirmChronosTimerSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const decision = String(formData.get("countTowardsLifetime") ?? "");
  const nextPath = getSafeNextPath(formData);

  if (!sessionId) {
    redirectWithAdminError("Choose a stopped session before updating the lifetime total.", nextPath);
  }

  if (decision !== "true" && decision !== "false") {
    redirectWithAdminError("Choose whether this stopped session should count toward lifetime totals.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const result = await confirmTimerSessionDecision(supabase, sessionId, decision === "true");

  if (!result.success) {
    redirectWithAdminError(result.error, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function confirmChronosTimerSessionSmooth(
  sessionId: string,
  countTowardsLifetime: boolean,
  durationSeconds?: number,
): Promise<SmoothTimerActionResult> {
  if (!sessionId) {
    return { success: false, error: "Choose a stopped session before updating the lifetime total." };
  }

  try {
    const supabase = await createChronosServerClient();
    const durationError = await applySessionDurationOverride(supabase, sessionId, getSafeDurationOverride(durationSeconds));

    if (durationError) {
      return { success: false, error: durationError };
    }

    const result = await confirmTimerSessionDecision(supabase, sessionId, countTowardsLifetime);

    if (!result.success) {
      return result;
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Stopped session could not be updated.",
    };
  }
}

export async function createChronosSkill(formData: FormData) {
  const nextPath = getSafeNextPath(formData);
  const payload = getSkillFormPayload(formData);

  if (!payload.name) {
    redirectWithAdminError("Name the dashboard card before adding it.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("create_skill", {
    p_name: payload.name,
    p_icon_key: payload.iconKey,
    p_accent_key: payload.accentKey,
    p_visibility: payload.visibility,
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Dashboard card could not be added.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function updateChronosSkill(formData: FormData) {
  const nextPath = getSafeNextPath(formData);
  const skillId = String(formData.get("skillId") ?? "");
  const payload = getSkillFormPayload(formData);
  const lifetimeSeconds = getLifetimeSeconds(formData);
  const weeklyTargetSeconds = getWeeklyTargetSeconds(formData);
  const targetSessionsPerWeek = getBoundedInteger(formData.get("targetSessionsPerWeek"), 0, 99, 0) ?? 0;
  const priorityWeight = getBoundedInteger(formData.get("priorityWeight"), 1, 5, 3) ?? 3;
  const goalNote = String(formData.get("goalNote") ?? "").trim();

  if (!skillId) {
    redirectWithAdminError("Choose a dashboard card before editing it.", nextPath);
  }

  if (!payload.name) {
    redirectWithAdminError("Name the dashboard card before saving it.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const updateResult = await updateSkillDetails(supabase, skillId, {
    ...payload,
    goalNote,
    priorityWeight,
    targetSessionsPerWeek,
    weeklyTargetSeconds,
  });

  if (!updateResult.success) {
    redirectWithAdminError(updateResult.error, nextPath);
  }

  if (lifetimeSeconds !== null) {
    const { data: lifetimeData, error: lifetimeError } = await supabase.rpc("set_skill_lifetime_seconds", {
      p_skill_id: skillId,
      p_lifetime_seconds: lifetimeSeconds,
    });

    if (lifetimeError) {
      redirectWithAdminError(lifetimeError.message, nextPath);
    }

    const lifetimeMessage = getRpcErrorMessage(lifetimeData, "Lifetime total could not be updated.");
    if (lifetimeData && typeof lifetimeData === "object" && "success" in lifetimeData && lifetimeData.success === false) {
      redirectWithAdminError(lifetimeMessage, nextPath);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function deleteChronosSkill(formData: FormData) {
  const nextPath = getSafeNextPath(formData);
  const skillId = String(formData.get("skillId") ?? "");

  if (!skillId) {
    redirectWithAdminError("Choose a dashboard card before deleting it.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("delete_skill", {
    p_skill_id: skillId,
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Dashboard card could not be deleted.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
}

export async function reorderChronosSkills(skillIds: string[]): Promise<SkillReorderActionResult> {
  const orderedSkillIds = Array.from(
    new Set(skillIds.map((skillId) => String(skillId).trim()).filter(Boolean)),
  );

  if (orderedSkillIds.length === 0) {
    return { success: true };
  }

  try {
    const supabase = await createChronosServerClient();

    for (const [index, skillId] of orderedSkillIds.entries()) {
      const { error } = await supabase
        .schema("chronos")
        .from("skills")
        .update({ sort_order: (index + 1) * 10 })
        .eq("id", skillId)
        .is("archived_at", null);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dashboard card order could not be saved.",
    };
  }
}
