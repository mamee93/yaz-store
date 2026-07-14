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
  full_name: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  last_sign_in_at: string | null;
  created_by: string | null;
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("admins")
    .select("id,auth_user_id,full_name,display_name,email,phone,role,is_active,must_change_password,last_sign_in_at,created_by")
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
  | "whatsapp_number"
  | "governorate"
  | "wilayat"
  | "area"
  | "detailed_address"
  | "updated_at"
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

  const admin = createAdminClient();
  const { data: byAuthUser, error: authLookupError } = await admin
    .from("customers")
    .select("id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,updated_at,created_at")
    .eq("auth_user_id", user.id)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<CustomerProfile | null>();

  if (authLookupError) {
    return {
      id: null,
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "عميل عود ياز",
      phone: user.user_metadata?.phone ?? "",
      email: user.email ?? null,
      whatsapp_number: user.user_metadata?.whatsapp_number ?? null,
      governorate: null,
      wilayat: null,
      area: null,
      detailed_address: null,
      updated_at: user.updated_at ?? user.created_at,
      created_at: user.created_at
    } satisfies CustomerProfile & { id: null };
  }

  if (byAuthUser) {
    return byAuthUser;
  }

  const { data: unlinkedByEmail } = user.email
    ? await admin
        .from("customers")
        .select("id,auth_user_id,full_name,phone,email,whatsapp_number,governorate,wilayat,area,detailed_address,updated_at,created_at")
        .eq("email", user.email)
        .is("auth_user_id", null)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .returns<CustomerProfile | null>()
    : { data: null };

  return (
    unlinkedByEmail ?? {
      id: null,
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "عميل عود ياز",
      phone: user.user_metadata?.phone ?? "",
      email: user.email ?? null,
      whatsapp_number: user.user_metadata?.whatsapp_number ?? null,
      governorate: null,
      wilayat: null,
      area: null,
      detailed_address: null,
      updated_at: user.updated_at ?? user.created_at,
      created_at: user.created_at
    }
  );
}
