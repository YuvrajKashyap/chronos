"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

const ALLOWED_ACCENTS = new Set(["coral", "blue", "amber", "violet", "teal", "indigo"]);

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

function getSkillFormPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const iconKey = String(formData.get("iconKey") ?? "sparkles").trim() || "sparkles";
  const requestedAccent = String(formData.get("accentKey") ?? "coral").trim();
  const visibility = String(formData.get("visibility") ?? "public") === "private" ? "private" : "public";

  return {
    accentKey: ALLOWED_ACCENTS.has(requestedAccent) ? requestedAccent : "coral",
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
  const { data, error } = await supabase.rpc("confirm_timer_session", {
    p_session_id: sessionId,
    p_count_towards_lifetime: decision === "true",
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Stopped session could not be updated.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(nextPath);
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

  if (!skillId) {
    redirectWithAdminError("Choose a dashboard card before editing it.", nextPath);
  }

  if (!payload.name) {
    redirectWithAdminError("Name the dashboard card before saving it.", nextPath);
  }

  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("update_skill", {
    p_skill_id: skillId,
    p_name: payload.name,
    p_icon_key: payload.iconKey,
    p_accent_key: payload.accentKey,
    p_visibility: payload.visibility,
  });

  if (error) {
    redirectWithAdminError(error.message, nextPath);
  }

  const message = getRpcErrorMessage(data, "Dashboard card could not be updated.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message, nextPath);
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
