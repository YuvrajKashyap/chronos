export type ChronosSupabaseEnv = {
  url: string;
  anonKey: string;
};

const SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function hasChronosSupabaseEnv() {
  return SUPABASE_ENV_KEYS.every((key) => Boolean(process.env[key]));
}

export function getChronosSupabaseEnv(): ChronosSupabaseEnv {
  const missing = SUPABASE_ENV_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
