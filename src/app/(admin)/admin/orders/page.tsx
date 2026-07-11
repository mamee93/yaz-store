import Link from "next/link";
import { Filter, RotateCcw, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrdersTable } from "@/components/admin/orders-table";
import { Button, Card, Input, Select } from "@/components/ui";
import { adminRoleLabels } from "@/constants/admin-roles";
import { getAdminOrders, getAssignableAdmins, type AdminOrderFilters } from "@/features/orders/queries";
import { orderStatusLabels } from "@/features/orders/labels";

type AdminOrdersPageProps = {
  searchParams: Promise<AdminOrderFilters & { message?: string }>;
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const params = await searchParams;
  const filters = normalizeFilters(params);
  const [orders, assignableAdmins] = await Promise.all([
    getAdminOrders(filters),
    getAssignableAdmins()
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الطلبات"
        title="إدارة الطلبات"
        description="متابعة طلبات العملاء، المسؤولين، حالات الدفع، والتنبيهات التشغيلية من مكان واحد."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <Card className="p-4 shadow-none sm:p-5">
        <form className="grid gap-4 lg:grid-cols-[minmax(12rem,1.4fr)_repeat(5,minmax(9rem,1fr))_auto] lg:items-end">
          <Input
            label="بحث"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="رقم الطلب أو العميل أو الهاتف"
          />
          <Select label="الحالة" name="status" defaultValue={filters.status ?? "all"}>
            <option value="all">كل الحالات</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="المسؤول"
            name="assigned_admin_id"
            defaultValue={filters.assigned_admin_id ?? "all"}
          >
            <option value="all">كل المسؤولين</option>
            <option value="unassigned">غير معيّن</option>
            {assignableAdmins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.display_name || admin.full_name} - {adminRoleLabels[admin.role]}
              </option>
            ))}
          </Select>
          <Select label="الدفع" name="payment_method" defaultValue={filters.payment_method ?? "all"}>
            <option value="all">كل طرق الدفع</option>
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input label="من" name="date_from" type="date" defaultValue={filters.date_from ?? ""} />
          <Input label="إلى" name="date_to" type="date" defaultValue={filters.date_to ?? ""} />
          <div className="flex gap-2">
            <Button type="submit" leftIcon={<Filter className="size-4" />} className="flex-1 lg:flex-none">
              تطبيق
            </Button>
            <Link
              href="/admin/orders"
              className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-4 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/45"
            >
              <RotateCcw className="size-4" aria-label="إعادة ضبط" />
            </Link>
          </div>
          <Search className="hidden" aria-hidden="true" />
        </form>
      </Card>
      <OrdersTable orders={orders} />
      <p className="text-xs text-oud-muted">
        يتم عرض أحدث 100 طلب مطابقة للفلاتر للحفاظ على سرعة لوحة الإدارة.
      </p>
    </div>
  );
}

function normalizeFilters(params: AdminOrderFilters): AdminOrderFilters {
  return {
    q: cleanParam(params.q),
    status: cleanParam(params.status) ?? "all",
    assigned_admin_id: cleanParam(params.assigned_admin_id) ?? "all",
    payment_method: cleanParam(params.payment_method) ?? "all",
    date_from: cleanParam(params.date_from),
    date_to: cleanParam(params.date_to)
  };
}

function cleanParam(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
