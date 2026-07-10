const auditActionLabels: Record<string, string> = {
  "admin.login": "تسجيل دخول",
  "admin.logout": "تسجيل خروج",
  "admin.create": "إضافة إداري",
  "admin.update": "تعديل إداري",
  "admin.disable": "تعطيل إداري",
  "admin.enable": "تفعيل إداري",
  "admin.password_reset_requested": "طلب إعادة تعيين كلمة المرور",
  "order.status_change": "تغيير حالة طلب",
  "order.cancel": "إلغاء طلب",
  "order.complete": "إكمال طلب"
};

export function getAuditActionLabel(action: string) {
  return auditActionLabels[action] ?? action;
}
