export type ChronosSupabaseEnv = {
  url: string;
  publishableKey: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseKey = supabasePublishableKey || supabaseAnonKey;

export function hasChronosSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getChronosSupabaseEnv(): ChronosSupabaseEnv {
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabaseKey
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)"
      : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    url: supabaseUrl!,
    publishableKey: supabaseKey!,
  };
}
