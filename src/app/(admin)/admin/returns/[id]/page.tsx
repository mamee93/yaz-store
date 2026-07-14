import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageCheck, ReceiptText, XCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReturnActionSubmitButton } from "@/components/admin/return-action-submit-button";
import { Badge, Card, Input, Price, Select, Textarea } from "@/components/ui";
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
  replacementStatusLabels,
  refundMethodLabels,
  returnedItemConditionLabels,
  returnResolutionTypeLabels,
  returnStatusLabels,
  returnTypeLabels
} from "@/features/returns/labels";
import { calculateRefundableAmount } from "@/features/returns/calculations";
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
    (returnRequest.resolution_type === null || returnRequest.resolution_type === "refund") &&
    (returnRequest.status === "received" ||
      (returnRequest.status === "approved" && returnRequest.return_type === "refund_only"));
  const canClose =
    (admin.role === "owner" || admin.role === "manager") &&
    returnRequest.status === "received" &&
    returnRequest.resolution_type !== "refund";
  const productRefundSummary = calculateRefundableAmount({
    productRefundOmr: returnRequest.expected_refund_omr,
    deliveryFeeOmr: returnRequest.order.delivery_fee_omr,
    orderTotalOmr: returnRequest.order.total_omr
  });
  const withDeliveryRefundSummary = calculateRefundableAmount({
    productRefundOmr: returnRequest.expected_refund_omr,
    deliveryFeeOmr: returnRequest.order.delivery_fee_omr,
    orderTotalOmr: returnRequest.order.total_omr,
    includeDeliveryFee: true
  });
  const finalRefundAmount = returnRequest.refund_amount_omr ?? productRefundSummary.totalRefundOmr;
  const deliveryFeeRefunded = Math.max(finalRefundAmount - productRefundSummary.productRefundOmr, 0);

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
              <Info
                label="نوع المعالجة"
                value={
                  returnRequest.resolution_type
                    ? returnResolutionTypeLabels[returnRequest.resolution_type]
                    : "لم يحدد بعد"
                }
              />
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

          {returnRequest.resolution_type === null || returnRequest.resolution_type === "refund" ? (
          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">تفاصيل مبلغ الاسترداد</h2>
            <p className="mt-1 text-sm leading-7 text-oud-muted">
              يتم احتساب الاسترداد من قيمة المنتجات المرتجعة فقط. رسوم التوصيل لا تضاف إلا بقرار واضح من الإدارة.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info
                label="قيمة المنتجات القابلة للاسترداد"
                value={`${productRefundSummary.productRefundOmr.toFixed(3)} ر.ع`}
                dir="ltr"
              />
              <Info
                label="رسوم التوصيل الأصلية"
                value={`${Number(returnRequest.order.delivery_fee_omr).toFixed(3)} ر.ع`}
                dir="ltr"
              />
              <Info
                label="الحد الأقصى بدون التوصيل"
                value={`${productRefundSummary.totalRefundOmr.toFixed(3)} ر.ع`}
                dir="ltr"
              />
              <Info
                label="الحد الأقصى مع التوصيل"
                value={`${withDeliveryRefundSummary.totalRefundOmr.toFixed(3)} ر.ع`}
                dir="ltr"
              />
              <Info label="المبلغ المطلوب استرداده" value={`${finalRefundAmount.toFixed(3)} ر.ع`} dir="ltr" />
              <Info label="رسوم التوصيل مشمولة؟" value={deliveryFeeRefunded > 0 ? "نعم" : "لا"} />
            </div>
          </Card>
          ) : null}

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
                    <p className="mt-1 text-sm text-oud-muted">
                      حالة القطعة: {returnedItemConditionLabels[item.returned_item_condition]}
                    </p>
                    {item.replacement_product_id ? (
                      <p className="mt-1 text-sm text-oud-muted">
                        المنتج البديل: <span dir="ltr">{item.replacement_product_id}</span> | الكمية: {item.replacement_quantity} | الحالة:{" "}
                        {item.replacement_status ? replacementStatusLabels[item.replacement_status] : "بانتظار الإرسال"}
                      </p>
                    ) : null}
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
                <Select name="resolution_type" label="نوع المعالجة" required defaultValue={getDefaultResolutionType(returnRequest.return_type)}>
                  {Object.entries(returnResolutionTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
                <div className="space-y-3 rounded-oud border border-oud-brown/10 bg-oud-beige/20 p-3">
                  <p className="text-sm font-semibold text-oud-brown">حالة القطع والبدائل</p>
                  {returnRequest.items.map((item) => {
                    const replacementProductId = item.order_item?.product_id ?? "";

                    return (
                      <div key={item.id} className="rounded-oud border border-oud-brown/10 bg-white p-3">
                        <p className="text-sm font-semibold text-oud-brown">
                          {item.order_item?.product_name_ar_snapshot ?? "منتج"}
                        </p>
                        <div className="mt-3 grid gap-3">
                          <Select name={`condition_${item.id}`} label="حالة القطعة المرتجعة" defaultValue="sellable" required>
                            {Object.entries(returnedItemConditionLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </Select>
                          <Input
                            name={`replacement_product_id_${item.id}`}
                            label="معرّف المنتج البديل"
                            defaultValue={replacementProductId}
                            dir="ltr"
                          />
                          <Input
                            name={`replacement_quantity_${item.id}`}
                            label="كمية البديل"
                            type="number"
                            min="0"
                            defaultValue={item.quantity}
                            dir="ltr"
                          />
                          <Select name={`replacement_status_${item.id}`} label="حالة إرسال البديل" defaultValue="pending">
                            {Object.entries(replacementStatusLabels).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Textarea name="admin_note" label="ملاحظة داخلية اختيارية" />
                <ReturnActionSubmitButton className="w-full" leftIcon={<CheckCircle2 className="size-4" />}>
                  اعتماد
                </ReturnActionSubmitButton>
              </form>
              <form action={rejectReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Textarea name="admin_note" label="سبب الرفض" required />
                <ReturnActionSubmitButton variant="danger" className="w-full" leftIcon={<XCircle className="size-4" />}>
                  رفض
                </ReturnActionSubmitButton>
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
                <ReturnActionSubmitButton className="w-full" leftIcon={<PackageCheck className="size-4" />}>
                  تسجيل الاستلام
                </ReturnActionSubmitButton>
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
                  max={withDeliveryRefundSummary.totalRefundOmr}
                  defaultValue={productRefundSummary.totalRefundOmr.toFixed(3)}
                  dir="ltr"
                  required
                />
                <label className="flex gap-3 rounded-oud border border-oud-brown/10 bg-oud-beige/20 p-3 text-sm leading-7 text-oud-brown">
                  <input
                    type="checkbox"
                    name="include_delivery_fee_in_refund"
                    className="mt-1 size-4 rounded border-oud-brown/30 text-oud-brown"
                  />
                  <span>
                    <span className="block font-semibold">استرداد رسوم التوصيل أيضًا</span>
                    <span className="block text-oud-muted">
                      خيار إداري فقط. عند تفعيله يمكن أن يصل السقف إلى قيمة المنتجات مع رسوم التوصيل دون تجاوز إجمالي الطلب.
                    </span>
                  </span>
                </label>
                <Input name="refund_reference" label="مرجع الاسترداد" dir="ltr" />
                <Textarea name="admin_note" label="ملاحظة داخلية" />
                <ReturnActionSubmitButton className="w-full" leftIcon={<ReceiptText className="size-4" />}>
                  تسجيل استرداد يدوي
                </ReturnActionSubmitButton>
              </form>
            </Card>
          ) : null}

          {canClose ? (
            <Card className="space-y-3 p-5 shadow-none">
              <h2 className="font-display text-xl font-bold text-oud-brown">إغلاق الاستبدال</h2>
              <form action={closeReturnAction.bind(null, returnRequest.id)} className="space-y-3">
                <Textarea name="admin_note" label="ملاحظة الإغلاق" />
                <ReturnActionSubmitButton variant="secondary" className="w-full">
                  إغلاق بدون استرداد
                </ReturnActionSubmitButton>
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

function getDefaultResolutionType(returnType: string) {
  return returnType === "exchange" ? "replacement_same_product" : "refund";
}
