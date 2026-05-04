"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getChronosSupabaseEnv } from "./env";

export function createChronosBrowserClient() {
  const { url, anonKey } = getChronosSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: "chronos",
    },
  });
}
