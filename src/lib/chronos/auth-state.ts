import { createChronosServerClient } from "@/lib/supabase/server";

export async function getChronosAuthState() {
  try {
    const supabase = await createChronosServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      isAuthenticated: Boolean(user),
      email: user?.email ?? null,
    };
  } catch {
    return {
      isAuthenticated: false,
      email: null,
    };
  }
}
