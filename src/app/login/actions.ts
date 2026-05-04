"use server";

import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

export type LoginFormState = {
  error: string | null;
  username: string;
};

const INVALID_CREDENTIALS = "Invalid username or password.";

function normalizeUsername(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function getOwnerLoginConfig() {
  const username = process.env.CHRONOS_OWNER_USERNAME?.trim().toLowerCase();
  const email = process.env.CHRONOS_OWNER_EMAIL?.trim().toLowerCase();

  if (!username || !email) {
    return null;
  }

  return { username, email };
}

export async function signInToChronos(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const username = normalizeUsername(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const config = getOwnerLoginConfig();

  if (!config) {
    return {
      username,
      error: "Chronos login is not configured.",
    };
  }

  if (username !== config.username || password.length === 0) {
    return {
      username,
      error: INVALID_CREDENTIALS,
    };
  }

  const supabase = await createChronosServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: config.email,
    password,
  });

  if (error) {
    return {
      username,
      error: INVALID_CREDENTIALS,
    };
  }

  redirect("/admin");
}
