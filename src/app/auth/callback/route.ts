import { NextResponse, type NextRequest } from "next/server";

import { createChronosServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (value === "/" || value === "/admin" || value === "/insights" || value === "/settings") {
    return value;
  }

  return "/admin";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  try {
    const supabase = await createChronosServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    const message = error instanceof Error ? error.message : "auth_callback_failed";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, requestUrl.origin));
  }
}
