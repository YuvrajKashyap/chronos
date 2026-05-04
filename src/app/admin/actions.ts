"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

function redirectWithAdminError(message: string) {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
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

  if (!skillId) {
    redirectWithAdminError("Choose a skill before starting a timer.");
  }

  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("start_timer", {
    p_skill_id: skillId,
  });

  if (error) {
    redirectWithAdminError(error.message);
  }

  const message = getRpcErrorMessage(data, "Timer could not be started.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function stopChronosTimer() {
  const supabase = await createChronosServerClient();
  const { data, error } = await supabase.rpc("stop_timer", {
    p_ended_at: new Date().toISOString(),
  });

  if (error) {
    redirectWithAdminError(error.message);
  }

  const message = getRpcErrorMessage(data, "Timer could not be stopped.");
  if (data && typeof data === "object" && "success" in data && data.success === false) {
    redirectWithAdminError(message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}
