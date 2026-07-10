export const ADMIN_ROLES = ["owner", "manager", "cashier", "staff"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "المالك",
  manager: "مدير",
  cashier: "كاشير",
  staff: "موظف"
};

export const adminRoleDescriptions: Record<AdminRole, string> = {
  owner: "صلاحية كاملة تشمل الفريق والإعدادات والتقارير والطلبات والمنتجات والعملاء والكوبونات.",
  manager: "يدير التشغيل اليومي للطلبات والمنتجات والعملاء والكوبونات والتقارير دون إدارة المالك أو الإعدادات الحساسة.",
  cashier: "يعرض الطلبات والعملاء ويحدث حالات الطلب دون الدخول إلى الإعدادات أو إدارة الفريق.",
  staff: "صلاحيات محدودة للعرض والمهام التشغيلية دون الفريق أو الإعدادات أو التقارير المالية."
};

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminRole(value: string | null | undefined): AdminRole {
  if (value === "order_staff") {
    return "cashier";
  }

  if (value === "viewer") {
    return "staff";
  }

  return isAdminRole(value) ? value : "staff";
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  if (pathname === "/admin") {
    return true;
  }

  if (pathname.startsWith("/admin/team/performance")) {
    return role === "owner" || role === "manager";
  }

  if (pathname === "/admin/team" || pathname === "/admin/team/new") {
    return role === "owner";
  }

  if (pathname.startsWith("/admin/team/")) {
    return true;
  }

  if (pathname.startsWith("/admin/activity")) {
    return role === "owner" || role === "manager";
  }

  if (pathname.startsWith("/admin/orders")) {
    return ["owner", "manager", "cashier", "staff"].includes(role);
  }

  if (pathname.startsWith("/admin/customers")) {
    return role === "owner" || role === "manager" || role === "cashier";
  }

  if (
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/coupons") ||
    pathname.startsWith("/admin/notifications") ||
    pathname.startsWith("/admin/shipping") ||
    pathname.startsWith("/admin/inventory") ||
    pathname.startsWith("/admin/banners")
  ) {
    return role === "owner" || role === "manager";
  }

  if (pathname.startsWith("/admin/settings")) {
    return role === "owner";
  }

  return role === "owner";
}

export function canManageOrders(role: AdminRole) {
  return role === "owner" || role === "manager" || role === "cashier";
}

export function canManageTeam(role: AdminRole) {
  return role === "owner";
}
