export type ChronosSupabaseEnv = {
  url: string;
  anonKey: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function hasChronosSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getChronosSupabaseEnv(): ChronosSupabaseEnv {
  const missing = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    url: supabaseUrl!,
    anonKey: supabaseAnonKey!,
  };
}
