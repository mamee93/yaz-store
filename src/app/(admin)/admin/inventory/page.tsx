import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryManagement } from "@/components/admin/inventory-management";

export default function AdminInventoryPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="المخزون"
        title="إدارة المخزون"
        description="جدول ثابت للمخزون ونموذج تعديل حركات المخزون."
      />
      <InventoryManagement />
    </div>
  );
}
