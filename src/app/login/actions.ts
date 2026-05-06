"use server";

import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

export type LoginFormState = {
  error: string | null;
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

function getSafeNextPath(value: FormDataEntryValue | null) {
  const nextPath = String(value ?? "/admin");

  if (nextPath === "/insights" || nextPath === "/settings" || nextPath === "/admin") {
    return nextPath;
  }

  return "/admin";
}

export async function signInToChronos(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const username = normalizeUsername(formData.get("chronos-access-name"));
  const password = String(formData.get("password") ?? "");
  const nextPath = getSafeNextPath(formData.get("nextPath"));
  const config = getOwnerLoginConfig();

  if (!config) {
    return {
      error: "Chronos login is not configured.",
    };
  }

  if (username !== config.username || password.length === 0) {
    return {
      error: INVALID_CREDENTIALS,
    };
  }

  try {
    const supabase = await createChronosServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: config.email,
      password,
    });

    if (error) {
      return {
        error: INVALID_CREDENTIALS,
      };
    }
  } catch {
    return {
      error: INVALID_CREDENTIALS,
    };
  }

  redirect(nextPath);
}
