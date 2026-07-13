import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageCheck, ReceiptText, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, Card, Input, Price, Select, Textarea } from "@/components/ui";
import { requireAdmin } from "@/features/auth/queries";
import {
  approveReturnAction,
  closeReturnAction,
  receiveReturnAction,
  refundReturnAction,
  rejectReturnAction
} from "@/features/returns/actions";
import {
  getReturnStatusVariant,
  refundMethodLabels,
  returnStatusLabels,
  returnTypeLabels
} from "@/features/returns/labels";
import { getAdminReturnById } from "@/features/returns/queries";

export const dynamic = "force-dynamic";

type AdminReturnDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; message?: string }>;
};

export default async function AdminReturnDetailPage({
  params,
  searchParams
}: AdminReturnDetailPageProps) {
  const [{ id }, query, admin] = await Promise.all([params, searchParams, requireAdmin()]);
  const returnRequest = await getAdminReturnById(id);

  if (!returnRequest || !admin) {
    notFound();
  }

  const canApprove = (admin.role === "owner" || admin.role === "manager") && returnRequest.status === "requested";
  const canReceive = ["owner", "manager", "cashier"].includes(admin.role) && returnRequest.status === "approved";
  const canRefund =
    (admin.role === "owner" || admin.role === "manager") &&
    (returnRequest.status === "received" ||
      (returnRequest.status === "approved" && returnRequest.return_type === "refund_only"));
  const canClose =
    (admin.role === "owner" || admin.role === "manager") &&
    returnRequest.status === "received" &&
    returnRequest.return_type === "exchange";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="تفاصيل المرتجع"
        title={`مرتجع الطلب ${returnRequest.order.order_number}`}
        description="مراجعة الطلب، المنتجات، الحالة، وتنفيذ الإجراءات المسموحة حسب الصلاحية."
        action={
          <Link
            href="/admin/returns"
            className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-5 text-sm font-semibold text-oud-brown"
          >
            العودة للمرتجعات
          </Link>
        }
      />
      <StatusMessage status={query.status} message={query.message} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <Card className="p-5 shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge variant={getReturnStatusVariant(returnRequest.status)}>
                  {returnStatusLabels[returnRequest.status]}
                </Badge>
                <p className="mt-3 font-semibold text-oud-brown" dir="ltr">{returnRequest.id}</p>
              </div>
              <Price value={returnRequest.refund_amount_omr ?? returnRequest.expected_refund_omr} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Info label="رقم الطلب" value={returnRequest.order.order_number} dir="ltr" />
              <Info label="العميل" value={returnRequest.customer_name} />
              <Info label="الهاتف" value={returnRequest.customer_phone} dir="ltr" />
              <Info label="النوع" value={returnTypeLabels[returnRequest.return_type]} />
              <Info label="السبب" value={returnRequest.reason} />
              <Info label="تاريخ الطلب" value={formatDate(returnRequest.requested_at)} />
              <Info label="المبلغ المتوقع" value={`${returnRequest.expected_refund_omr.toFixed(3)} ر.ع`} dir="ltr" />
              {returnRequest.refund_method ? (
                <Info label="طريقة الاسترداد" value={refundMethodLabels[returnRequest.refund_method]} />
              ) : null}
            </div>
            {returnRequest.customer_note ? (
              <div className="mt-5 rounded-oud bg-oud-beige/25 p-4 text-sm leading-7 text-oud-muted">
                <p className="font-semibold text-oud-brown">ملاحظة العميل</p>
                <p className="mt-1">{returnRequest.customer_note}</p>
              </div>
            ) : null}
            {returnRequest.admin_note ? (
              <div className="mt-5 rounded-oud bg-oud-pearl p-4 text-sm leading-7 text-oud-muted">
                <p className="font-semibold text-oud-brown">ملاحظة الإدارة</p>
                <p className="mt-1">{returnRequest.admin_note}</p>
              </div>
            ) : null}
          </Card>

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-oud-brown/10 p-5">
              <h2 className="font-display text-2xl font-bold text-oud-brown">المنتجات</h2>
            </div>
            <div className="divide-y divide-oud-brown/10">
              {returnRequest.items.map((item) => (
                <div key={item.id} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-semibold text-oud-brown">
                      {item.order_item?.product_name_ar_snapshot ?? "منتج"}
                    </p>
                    <p className="mt-1 text-sm text-oud-muted">
                      الكمية: {item.quantity} | إرجاع للمخزون: {item.return_to_stock ? "نعم" : "لا"}
                    </p>
                  </div>
                  <Price value={item.line_refund_omr} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">Timeline</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Timeline label="تم الطلب" value={returnRequest.requested_at} />
              <Timeline label="تم الاعتماد" value={returnRequest.approved_at} admin={returnRequest.approved_by_admin_id ? returnRequest.admin_names[returnRequest.approved_by_admin_id] : null} />
              <Timeline label="تم الرفض" value={returnRequest.rejected_at} admin={returnRequest.rejected_by_admin_id ? returnRequest.admin_names[returnRequest.rejected_by_admin_id] : null} />
              <Timeline label="تم الاستلام" value={returnRequest.received_at} admin={returnRequest.received_by_admin_id ? returnRequest.admin_names[returnRequest.received_by_admin_id] : null} />
              <Timeline label="تم الاسترداد" value={returnRequest.refunded_at} admin={returnRequest.refunded_by_admin_id ? returnRequest.admin_names[returnRequest.refunded_by_admin_id] : null} />
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          {canApprove ? (
            <Card className="space-y-3 p-5 shadow-none">
              <h2 className="font-display text-xl font-bold text-oud-brown">المراجعة</h2>
              <form action={approveReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Textarea name="admin_note" label="ملاحظة داخلية اختيارية" />
                <Button type="submit" className="w-full" leftIcon={<CheckCircle2 className="size-4" />}>
                  اعتماد
                </Button>
              </form>
              <form action={rejectReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Textarea name="admin_note" label="سبب الرفض" required />
                <Button type="submit" variant="danger" className="w-full" leftIcon={<XCircle className="size-4" />}>
                  رفض
                </Button>
              </form>
            </Card>
          ) : null}

          {canReceive ? (
            <Card className="space-y-3 p-5 shadow-none">
              <h2 className="font-display text-xl font-bold text-oud-brown">استلام المنتجات</h2>
              <p className="text-sm leading-7 text-oud-muted">
                سيتم إرجاع العناصر المحددة إلى المخزون مرة واحدة فقط عند نجاح العملية.
              </p>
              <form action={receiveReturnAction.bind(null, returnRequest.id)}>
                <Button type="submit" className="w-full" leftIcon={<PackageCheck className="size-4" />}>
                  تسجيل الاستلام
                </Button>
              </form>
            </Card>
          ) : null}

          {canRefund ? (
            <Card className="space-y-3 p-5 shadow-none">
              <h2 className="font-display text-xl font-bold text-oud-brown">تسجيل الاسترداد</h2>
              <form action={refundReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Select name="refund_method" label="طريقة الاسترداد" required defaultValue="manual">
                  {Object.entries(refundMethodLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
                <Input
                  name="refund_amount_omr"
                  label="مبلغ الاسترداد"
                  type="number"
                  step="0.001"
                  min="0"
                  max={returnRequest.expected_refund_omr}
                  defaultValue={returnRequest.expected_refund_omr.toFixed(3)}
                  dir="ltr"
                  required
                />
                <Input name="refund_reference" label="مرجع الاسترداد" dir="ltr" />
                <Textarea name="admin_note" label="ملاحظة داخلية" />
                <Button type="submit" className="w-full" leftIcon={<ReceiptText className="size-4" />}>
                  تسجيل استرداد يدوي
                </Button>
              </form>
            </Card>
          ) : null}

          {canClose ? (
            <Card className="space-y-3 p-5 shadow-none">
              <h2 className="font-display text-xl font-bold text-oud-brown">إغلاق الاستبدال</h2>
              <form action={closeReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Textarea name="admin_note" label="ملاحظة الإغلاق" />
                <Button type="submit" variant="secondary" className="w-full">
                  إغلاق بدون استرداد
                </Button>
              </form>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "rtl" | "ltr" }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <p className="mt-2 font-semibold text-oud-brown" dir={dir}>{value}</p>
    </div>
  );
}

function Timeline({ label, value, admin }: { label: string; value: string | null; admin?: string | null }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <p className="font-semibold text-oud-brown">{label}</p>
      <p className="mt-1 text-sm text-oud-muted">{value ? formatDate(value) : "لم يحدث بعد"}</p>
      {admin ? <p className="mt-1 text-xs text-oud-muted">{admin}</p> : null}
    </div>
  );
}

function StatusMessage({ status, message }: { status?: string; message?: string }) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
