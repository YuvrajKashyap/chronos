"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getChronosSupabaseEnv } from "./env";

export function createChronosBrowserClient() {
  const { url, publishableKey } = getChronosSupabaseEnv();

  return createBrowserClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    db: {
      schema: "chronos",
    },
  });
}
