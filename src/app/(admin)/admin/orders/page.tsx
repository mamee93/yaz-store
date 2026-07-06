import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { getAdminOrders } from "@/features/orders/queries";

type AdminOrdersPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const [orders, params] = await Promise.all([getAdminOrders(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الطلبات"
        title="إدارة الطلبات"
        description="متابعة طلبات العملاء، حالات الدفع، الإجماليات، وتفاصيل تجهيز الطلب."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <OrdersTable orders={orders} />
    </div>
  );
}

function AdminStatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
}
