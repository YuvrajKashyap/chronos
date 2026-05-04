"use server";

import { redirect } from "next/navigation";

import { createChronosServerClient } from "@/lib/supabase/server";

export async function logoutFromChronos() {
  const supabase = await createChronosServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
