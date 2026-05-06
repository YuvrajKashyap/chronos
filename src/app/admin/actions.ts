"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

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

export async function logoutFromChronos() {
  const supabase = await createChronosServerClient();
  await supabase.auth.signOut();
  redirect("/login");
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
