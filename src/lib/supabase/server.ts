import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getChronosSupabaseEnv } from "./env";

export function createChronosServerClient() {
  const { url, anonKey } = getChronosSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "chronos",
    },
  });
}
