import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessAdminPath,
  normalizeAdminRole,
  type AdminRole
} from "@/constants/admin-roles";
import type { Database } from "@/types/database";

export type AdminProfile = {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  display_name: string | null;
  email: string;
  role: AdminRole;
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
    .select("id,auth_user_id,full_name,display_name,email,role,is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle()
    .returns<AdminProfile | null>();

  if (error || !data || !data.is_active) {
    return null;
  }

  return {
    ...data,
    role: normalizeAdminRole(data.role)
  };
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return null;
  }

  return admin;
}

export async function requireAdminRole(allowedRoles: AdminRole[]) {
  const admin = await requireAdmin();

  if (!admin || !allowedRoles.includes(admin.role)) {
    return null;
  }

  return admin;
}

export async function requireAdminPathAccess(pathname: string) {
  const admin = await requireAdmin();

  if (!admin || !canAccessAdminPath(admin.role, pathname)) {
    return null;
  }

  return admin;
}

export type CustomerProfile = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  | "auth_user_id"
  | "full_name"
  | "phone"
  | "email"
  | "governorate"
  | "wilayat"
  | "area"
  | "detailed_address"
  | "created_at"
> & {
  id: string | null;
};

export async function getCurrentCustomer() {
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

  const filter = user.email
    ? `auth_user_id.eq.${user.id},email.eq.${user.email}`
    : `auth_user_id.eq.${user.id}`;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id,auth_user_id,full_name,phone,email,governorate,wilayat,area,detailed_address,created_at")
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<CustomerProfile | null>();

  if (error) {
    return {
      id: null,
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "عميل عود ياز",
      phone: user.user_metadata?.phone ?? "",
      email: user.email ?? null,
      governorate: null,
      wilayat: null,
      area: null,
      detailed_address: null,
      created_at: user.created_at
    } satisfies CustomerProfile & { id: null };
  }

  return (
    data ?? {
      id: null,
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "عميل عود ياز",
      phone: user.user_metadata?.phone ?? "",
      email: user.email ?? null,
      governorate: null,
      wilayat: null,
      area: null,
      detailed_address: null,
      created_at: user.created_at
    }
  );
}
