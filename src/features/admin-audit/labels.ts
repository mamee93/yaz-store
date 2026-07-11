const auditActionLabels: Record<string, string> = {
  "admin.login": "تسجيل دخول",
  "admin.logout": "تسجيل خروج",
  "admin.create": "إضافة إداري",
  "admin.update": "تعديل إداري",
  "admin.delete": "حذف إداري",
  "admin.disable": "تعطيل إداري",
  "admin.enable": "تفعيل إداري",
  "admin.password_reset_requested": "طلب إعادة تعيين كلمة المرور",
  "order.status_change": "تغيير حالة طلب",
  "order.cancel": "إلغاء طلب",
  "order.complete": "إكمال طلب",
  "order.assigned": "تعيين مسؤول الطلب",
  "order.unassigned": "إلغاء تعيين مسؤول الطلب",
  "order.note_added": "إضافة ملاحظة داخلية",
  "order.note_updated": "تعديل ملاحظة داخلية",
  "order.note_deleted": "حذف ملاحظة داخلية",
  "note.delete": "حذف ملاحظة داخلية",
  "order.invoice_printed": "طباعة الفاتورة",
  "order.shipping_label_printed": "طباعة بوليصة الشحن",
  "banner.delete": "حذف بنر",
  "product.delete": "حذف منتج",
  "product.disable": "تعطيل منتج",
  "category.delete": "حذف تصنيف",
  "category.disable": "تعطيل تصنيف",
  "coupon.delete": "حذف كوبون",
  "coupon.disable": "تعطيل كوبون",
  "coupon.enable": "تفعيل كوبون",
  "occasion.delete": "حذف مناسبة",
  "customer.delete_test": "حذف عميل تجريبي"
};

export function getAuditActionLabel(action: string) {
  return auditActionLabels[action] ?? action;
}
