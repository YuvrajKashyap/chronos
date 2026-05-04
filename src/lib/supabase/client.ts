"use client";

import { createClient } from "@supabase/supabase-js";

import { getChronosSupabaseEnv } from "./env";

export function createChronosBrowserClient() {
  const { url, anonKey } = getChronosSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: "chronos",
    },
  });
}
