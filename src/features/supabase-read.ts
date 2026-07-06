import { createClient } from "@/lib/supabase/server";

export function hasSupabaseReadEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function createReadClient() {
  if (!hasSupabaseReadEnv()) {
    return null;
  }

  return createClient();
}
