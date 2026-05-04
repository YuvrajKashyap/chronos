import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getChronosSupabaseEnv } from "./env";

export async function createChronosServerClient() {
  const { url, anonKey } = getChronosSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read cookies but cannot always write them.
          // Route handlers and server actions use this same client to persist auth cookies.
        }
      },
    },
    db: {
      schema: "chronos",
    },
  });
}
