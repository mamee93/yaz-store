export const ADMIN_ROLES = ["owner", "manager", "order_staff", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "المالك",
  manager: "مدير",
  order_staff: "موظف طلبات",
  viewer: "مشاهدة فقط"
};

export const adminRoleDescriptions: Record<AdminRole, string> = {
  owner: "صلاحية كاملة تشمل إدارة الفريق والإعدادات وكل أقسام لوحة التحكم.",
  manager: "إدارة المنتجات والطلبات والعملاء والكوبونات والتوصيل والتنبيهات بدون إدارة الفريق.",
  order_staff: "الوصول إلى لوحة التحكم والطلبات مع إمكانية تحديث حالة الطلب فقط.",
  viewer: "عرض لوحة التحكم والطلبات فقط بدون تعديل."
};

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminRole(value: string | null | undefined): AdminRole {
  if (value === "staff") {
    return "order_staff";
  }

  return isAdminRole(value) ? value : "viewer";
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  if (pathname === "/admin") {
    return true;
  }

  if (pathname.startsWith("/admin/orders")) {
    return ["owner", "manager", "order_staff", "viewer"].includes(role);
  }

  if (pathname.startsWith("/admin/team")) {
    return role === "owner";
  }

  if (
    pathname.startsWith("/admin/settings") ||
    pathname.startsWith("/admin/products") ||
    pathname.startsWith("/admin/categories") ||
    pathname.startsWith("/admin/customers") ||
    pathname.startsWith("/admin/coupons") ||
    pathname.startsWith("/admin/notifications") ||
    pathname.startsWith("/admin/shipping") ||
    pathname.startsWith("/admin/inventory") ||
    pathname.startsWith("/admin/banners")
  ) {
    return role === "owner" || role === "manager";
  }

  return role === "owner";
}

export function canManageOrders(role: AdminRole) {
  return role === "owner" || role === "manager" || role === "order_staff";
}

export function canManageTeam(role: AdminRole) {
  return role === "owner";
}
