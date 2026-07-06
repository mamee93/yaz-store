import { createClient } from "@/lib/supabase/server";

export type AdminProfile = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
};

export async function getCurrentAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("admins")
    .select("id,auth_user_id,full_name,email,role,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle()
    .returns<AdminProfile | null>();

  if (error || !data || !data.is_active) {
    return null;
  }

  return data;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return null;
  }

  return admin;
}
