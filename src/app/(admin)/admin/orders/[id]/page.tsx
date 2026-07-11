import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { canManageOrders } from "@/constants/admin-roles";
import { requireAdmin } from "@/features/auth/queries";
import { getAdminOrderById } from "@/features/orders/queries";

type AdminOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminOrderPage({ params, searchParams }: AdminOrderPageProps) {
  const [{ id }, resolvedSearchParams, admin] = await Promise.all([
    params,
    searchParams,
    requireAdmin()
  ]);
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  const canUpdateOrder = admin ? canManageOrders(admin.role) : false;
  const canAssignOrder = admin?.role === "owner" || admin?.role === "manager";
  const canManageNotes = admin?.role === "owner" || admin?.role === "manager" || admin?.role === "cashier";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الطلبات"
        title="تفاصيل الطلب"
        description={`عرض تفاصيل الطلب ${order.order_number}، العميل، المنتجات، وتحديث الحالة.`}
      />
      <AdminStatusMessage
        status={resolvedSearchParams.status}
        message={resolvedSearchParams.message}
      />
      <OrderDetailView
        order={order}
        canUpdateOrder={canUpdateOrder}
        canAssignOrder={canAssignOrder}
        canManageNotes={canManageNotes}
        canPrintOrder={canManageNotes}
      />
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
