import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InventoryManagement } from "@/components/admin/inventory-management";

export default function AdminInventoryPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={"\u0627\u0644\u0645\u062e\u0632\u0648\u0646"}
        title={"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646"}
        description={"\u062c\u062f\u0648\u0644 \u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0648\u0645\u062f\u062e\u0644 \u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0648\u0646."}
        action={
          <Link href="/admin/inventory/alerts" className="inline-flex h-10 items-center justify-center rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory">
            {"\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0648\u0646"}
          </Link>
        }
      />
      <InventoryManagement />
    </div>
  );
}