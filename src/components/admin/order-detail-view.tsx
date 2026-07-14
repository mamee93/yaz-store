import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  ExternalLink,
  Pin,
  Save,
  Trash2,
  UserCheck,
  UserMinus
} from "lucide-react";
import { adminRoleLabels } from "@/constants/admin-roles";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { Badge, Button, Card, Price, Select, Textarea } from "@/components/ui";
import { OrderPrintActions } from "@/components/admin/order-print-actions";
import {
  addOrderInternalNoteAction,
  assignOrderAction,
  deleteOrderInternalNoteAction,
  unassignOrderAction,
  updateOrderAction,
  updateOrderInternalNoteAction
} from "@/features/orders/actions";
import { getOrderEventLabel, getOrderStatusLabel } from "@/features/orders/labels";
import type { AdminOrderDetail, OrderInternalNoteItem } from "@/features/orders/queries";
import { OrderStatusSelect, orderStatusLabels } from "./order-status-select";

type OrderReturnSummary = AdminOrderDetail["returns"][number];
type OrderItemLookup = Map<string, AdminOrderDetail["order_items"][number]>;

type OrderDetailViewProps = {
  order: AdminOrderDetail;
  canUpdateOrder?: boolean;
  canAssignOrder?: boolean;
  canManageNotes?: boolean;
  canPrintOrder?: boolean;
};

const openReturnStatuses: OrderReturnSummary["status"][] = ["requested", "approved", "received"];

const orderReturnStatusLabels: Record<OrderReturnSummary["status"], string> = {
  requested: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  received: "تم الاستلام",
  refunded: "تم الاسترداد",
  closed: "مغلق"
};

const orderReturnTypeLabels: Record<OrderReturnSummary["return_type"], string> = {
  full_return: "إرجاع كامل",
  partial_return: "إرجاع جزئي",
  exchange: "استبدال",
  refund_only: "استرداد فقط"
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

const paymentStatusLabels: Record<AdminOrderDetail["payment_status"], string> = {
  pending: "بانتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
  cancelled: "ملغي"
};

const deliveryMethodLabels = {
  pickup_office: "استلام من المكتب",
  home_delivery: "توصيل للمنزل"
};

export function OrderDetailView({
  order,
  canUpdateOrder = true,
  canAssignOrder = false,
  canManageNotes = false,
  canPrintOrder = false
}: OrderDetailViewProps) {
  const updateAction = updateOrderAction.bind(null, order.id);
  const assignAction = assignOrderAction.bind(null, order.id);
  const unassignAction = unassignOrderAction.bind(null, order.id);
  const addNoteAction = addOrderInternalNoteAction.bind(null, order.id);
  const address = parseAddressSnapshot(order.delivery_address_snapshot);
  const returnRequests = order.returns ?? [];
  const openReturn = returnRequests.find((item) => isOpenReturnStatus(item.status));
  const orderItemsById = new Map(order.order_items.map((item) => [item.id, item]));

  return (
    <>
      <style>
        {`
          @media print {
            .admin-order-screen { display: none !important; }
            .order-print-section { display: none !important; direction: rtl; color: #23160f; padding: 28px; font-family: Arial, sans-serif; }
            body[data-order-print-mode="invoice"] .order-print-invoice { display: block !important; }
            body[data-order-print-mode="shipping_label"] .order-print-shipping-label { display: block !important; }
          }
        `}
      </style>
      <div className="admin-order-screen grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          {openReturn ? <OpenReturnAlert returnRequest={openReturn} /> : null}

          <Card className="p-4 shadow-none sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs text-oud-muted">رقم الطلب</p>
                <h2 className="mt-1 text-2xl font-bold text-oud-brown" dir="ltr">
                  {order.order_number}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-xs text-oud-muted">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  {orderStatusLabels[order.status]}
                </Badge>
                <Badge variant="soft">{paymentStatusLabels[order.payment_status]}</Badge>
                {order.stock_deducted_at ? <Badge variant="soft">تم خصم المخزون</Badge> : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="العميل" value={order.customer_name_snapshot} />
              <MiniStat label="الهاتف" value={order.customer_phone_snapshot} dir="ltr" />
              <MiniStat label="الدفع" value={paymentMethodLabels[order.payment_method]} />
              <MiniStat label="الإجمالي" value={<Price value={order.total_omr} />} />
            </div>
          </Card>

          {canPrintOrder ? (
            <Card className="p-4 shadow-none sm:p-5">
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
                  الطباعة والمستندات
                </h2>
                <p className="mt-1 text-sm text-oud-muted">
                  اطبع فاتورة الطلب أو بوليصة الشحن، وسيتم تسجيل الحدث في سجل الطلب.
                </p>
              </div>
              <OrderPrintActions orderId={order.id} />
            </Card>
          ) : null}

          {order.invoice_id ? (
            <Card className="p-4 shadow-none sm:p-5">
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
                  الفاتورة
                </h2>
                <p className="mt-1 text-sm text-oud-muted" dir="ltr">
                  {order.invoice_number}
                </p>
              </div>
              <InvoiceActions invoiceId={order.invoice_id} />
            </Card>
          ) : null}

          {returnRequests.length > 0 ? (
            <OrderReturnsSummary returns={returnRequests} orderItemsById={orderItemsById} />
          ) : null}

          <Card className="overflow-hidden shadow-none">
            <div className="border-b border-oud-brown/10 p-4 sm:p-5">
              <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">المنتجات</h2>
            </div>
            <div className="divide-y divide-oud-brown/10">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-beige/35">
                      {item.product_image_url_snapshot ? (
                        <Image
                          src={item.product_image_url_snapshot}
                          alt={item.product_name_ar_snapshot}
                          fill
                          sizes="4rem"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-oud-brown">{item.product_name_ar_snapshot}</p>
                      <p className="mt-1 text-xs text-oud-muted">
                        الكمية: {item.quantity} · {item.sku_snapshot ?? "بدون SKU"}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:shrink-0">
                    <Price value={item.line_total_omr} />
                    <p className="mt-1 text-xs text-oud-muted">
                      <Price value={item.unit_price_omr} className="text-xs text-oud-muted" /> للقطعة
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
              عنوان التوصيل
            </h2>
            <div className="mt-4 space-y-2 text-sm leading-7 text-oud-muted">
              <p>
                {address.country}، {address.governorate}، {address.wilayat}
              </p>
              {address.area ? <p>{address.area}</p> : null}
              <p>{address.address_line_1}</p>
              {address.delivery_notes ? <p>ملاحظات: {address.delivery_notes}</p> : null}
            </div>
          </Card>

          {order.customer_notes ? (
            <Card className="p-4 shadow-none sm:p-5">
              <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
                ملاحظات العميل
              </h2>
              <p className="mt-4 text-sm leading-7 text-oud-muted">{order.customer_notes}</p>
            </Card>
          ) : null}

          <InternalNotes
            orderId={order.id}
            notes={order.internal_notes}
            canManageNotes={canManageNotes}
            addNoteAction={addNoteAction}
          />
        </div>

        <aside className="space-y-5">
          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">العميل</h2>
            <div className="mt-4 space-y-2 text-sm text-oud-muted">
              <p className="font-semibold text-oud-brown">{order.customer_name_snapshot}</p>
              <p dir="ltr">{order.customer_phone_snapshot}</p>
              <p>{paymentMethodLabels[order.payment_method]}</p>
              <p>{paymentStatusLabels[order.payment_status]}</p>
              {order.delivery_method || address.delivery_method_label ? (
                <p>
                  {order.delivery_method
                    ? deliveryMethodLabels[order.delivery_method]
                    : address.delivery_method_label}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
              مسؤول الطلب
            </h2>
            <div className="mt-4 rounded-oud bg-oud-beige/35 p-3 text-sm">
              {order.assigned_admin ? (
                <div className="space-y-1">
                  <p className="font-semibold text-oud-brown">
                    {order.assigned_admin.display_name || order.assigned_admin.full_name}
                  </p>
                  <p className="text-oud-muted">{adminRoleLabels[order.assigned_admin.role]}</p>
                  <p className="text-xs text-oud-muted" dir="ltr">
                    {order.assigned_admin.email}
                  </p>
                </div>
              ) : (
                <p className="text-oud-muted">لم يتم تعيين مسؤول لهذا الطلب بعد.</p>
              )}
            </div>

            {canAssignOrder ? (
              <div className="mt-4 space-y-3">
                <form action={assignAction} className="space-y-3">
                  <Select
                    label="تعيين إلى"
                    name="assigned_admin_id"
                    defaultValue={order.assigned_admin_id ?? ""}
                    required
                  >
                    <option value="" disabled>
                      اختر مسؤولًا
                    </option>
                    {order.assignable_admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.display_name || admin.full_name} - {adminRoleLabels[admin.role]}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" className="w-full" leftIcon={<UserCheck className="size-4" />}>
                    حفظ المسؤول
                  </Button>
                </form>
                {order.assigned_admin_id ? (
                  <form action={unassignAction}>
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      leftIcon={<UserMinus className="size-4" />}
                    >
                      إلغاء التعيين
                    </Button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">الإجماليات</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow label="المجموع الفرعي" value={<Price value={order.subtotal_omr} />} />
              <SummaryRow label="التوصيل" value={<Price value={order.delivery_fee_omr} />} />
              {order.coupon_code ? (
                <SummaryRow label="كود الخصم" value={<span dir="ltr">{order.coupon_code}</span>} />
              ) : null}
              <SummaryRow label="الخصم" value={<Price value={order.discount_omr} />} />
              <SummaryRow label="الضريبة" value={<Price value={order.tax_omr} />} />
              <SummaryRow label="الإجمالي" value={<Price value={order.total_omr} className="text-lg" />} />
            </div>
          </Card>

          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">إدارة الطلب</h2>
            {canUpdateOrder ? (
              <form action={updateAction} className="mt-5 space-y-4">
                <OrderStatusSelect defaultValue={order.status} />
                <Textarea
                  label="ملاحظات الإدارة"
                  name="admin_notes"
                  defaultValue={order.admin_notes ?? ""}
                />
                <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
                  تحديث الطلب
                </Button>
              </form>
            ) : (
              <p className="mt-4 rounded-oud bg-oud-beige/35 p-3 text-sm leading-7 text-oud-muted">
                لديك صلاحية مشاهدة فقط. لا يمكنك تحديث حالة الطلب أو ملاحظات الإدارة.
              </p>
            )}
          </Card>

          <Timeline order={order} />
        </aside>
      </div>

      <PrintableInvoice order={order} address={address} />
      <PrintableShippingLabel order={order} address={address} />
    </>
  );
}

function OpenReturnAlert({ returnRequest }: { returnRequest: OrderReturnSummary }) {
  return (
    <Card className="border-oud-gold/45 bg-oud-gold/10 p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-oud-gold/20 text-oud-brown">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-oud-brown">
              يوجد طلب إرجاع يحتاج إلى مراجعة
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="soft" className={getReturnStatusBadgeClass(returnRequest.status)}>
                {orderReturnStatusLabels[returnRequest.status]}
              </Badge>
              <span className="text-xs text-oud-muted" dir="ltr">
                {returnRequest.id}
              </span>
            </div>
          </div>
        </div>
        <AdminReturnLink returnId={returnRequest.id} label="عرض ومعالجة المرتجع" />
      </div>
    </Card>
  );
}

function OrderReturnsSummary({
  returns,
  orderItemsById
}: {
  returns: OrderReturnSummary[];
  orderItemsById: OrderItemLookup;
}) {
  return (
    <Card className="p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
            طلبات الإرجاع والاستبدال
          </h2>
          <p className="mt-1 text-sm text-oud-muted">
            ملخص المرتجعات المرتبطة بهذا الطلب، وتبقى المعالجة داخل صفحة المرتجع المستقلة.
          </p>
        </div>
        <Badge variant="soft">{returns.length} طلب</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        {returns.map((returnRequest) => (
          <div
            key={returnRequest.id}
            className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="soft" className={getReturnStatusBadgeClass(returnRequest.status)}>
                    {orderReturnStatusLabels[returnRequest.status]}
                  </Badge>
                  <Badge variant="soft">{orderReturnTypeLabels[returnRequest.return_type]}</Badge>
                  <span className="text-xs font-semibold text-oud-muted" dir="ltr">
                    {returnRequest.id}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MiniStat label="رقم المرتجع" value={returnRequest.id} dir="ltr" />
                  <MiniStat label="تاريخ الطلب" value={formatDateTime(returnRequest.requested_at)} />
                  <MiniStat label="المبلغ المتوقع" value={<Price value={returnRequest.expected_refund_omr} />} />
                  <MiniStat label="السبب" value={returnRequest.reason || "غير محدد"} />
                </div>
              </div>
              <AdminReturnLink returnId={returnRequest.id} label="عرض ومعالجة المرتجع" />
            </div>

            <div className="mt-4 rounded-oud bg-white/70 p-3">
              <h3 className="text-sm font-semibold text-oud-brown">المنتجات والكميات</h3>
              {returnRequest.order_return_items.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {returnRequest.order_return_items.map((item) => {
                    const orderItem = orderItemsById.get(item.order_item_id);

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-md border border-oud-brown/10 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-oud-brown">
                            {orderItem?.product_name_ar_snapshot ?? "منتج غير متوفر"}
                          </p>
                          <p className="mt-1 text-xs text-oud-muted" dir="ltr">
                            {orderItem?.sku_snapshot ?? item.order_item_id}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-oud-muted">
                          <span>الكمية: {item.quantity}</span>
                          <span>·</span>
                          <Price value={item.line_refund_omr} className="text-sm text-oud-muted" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-oud-beige/35 p-3 text-sm text-oud-muted">
                  لا توجد عناصر مسجلة لهذا المرتجع.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminReturnLink({ returnId, label }: { returnId: string; label: string }) {
  return (
    <Link
      href={`/admin/returns/${returnId}`}
      className="inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-oud-brown px-4 py-2 text-center text-sm font-semibold text-oud-ivory transition hover:bg-oud-coffee sm:w-auto"
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function InternalNotes({
  orderId,
  notes,
  canManageNotes,
  addNoteAction
}: {
  orderId: string;
  notes: OrderInternalNoteItem[];
  canManageNotes: boolean;
  addNoteAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="p-4 shadow-none sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">
            ملاحظات داخلية
          </h2>
          <p className="mt-1 text-sm text-oud-muted">تظهر للإدارة فقط ولا تصل إلى العميل.</p>
        </div>
        <Badge variant="soft">{notes.length} ملاحظة</Badge>
      </div>

      {canManageNotes ? (
        <form action={addNoteAction} className="mt-5 space-y-3">
          <Textarea label="إضافة ملاحظة" name="note" rows={3} maxLength={2000} required />
          <label className="flex items-center gap-2 text-sm font-semibold text-oud-brown">
            <input name="is_pinned" type="checkbox" className="size-4 accent-oud-brown" />
            تثبيت الملاحظة
          </label>
          <Button type="submit" leftIcon={<Save className="size-4" />}>
            حفظ الملاحظة
          </Button>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {notes.length === 0 ? (
          <p className="rounded-oud bg-oud-beige/35 p-3 text-sm text-oud-muted">
            لا توجد ملاحظات داخلية لهذا الطلب.
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-oud-muted">
                  <span className="font-semibold text-oud-brown">{note.admin_name ?? "إداري"}</span>
                  <span> · {formatDateTime(note.created_at)}</span>
                </div>
                {note.is_pinned ? (
                  <Badge variant="gold" className="gap-1">
                    <Pin className="size-3" aria-hidden="true" />
                    مثبتة
                  </Badge>
                ) : null}
              </div>
              {canManageNotes ? (
                <div className="space-y-3">
                  <form
                    action={updateOrderInternalNoteAction.bind(null, orderId, note.id)}
                    className="space-y-3"
                  >
                    <Textarea name="note" defaultValue={note.note} rows={3} maxLength={2000} required />
                    <label className="flex items-center gap-2 text-sm font-semibold text-oud-brown">
                      <input
                        name="is_pinned"
                        type="checkbox"
                        defaultChecked={note.is_pinned}
                        className="size-4 accent-oud-brown"
                      />
                      تثبيت
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" size="sm" leftIcon={<Check className="size-4" />}>
                        حفظ
                      </Button>
                    </div>
                  </form>
                  <ConfirmActionButton
                    action={deleteOrderInternalNoteAction.bind(null, orderId, note.id)}
                    triggerLabel="حذف"
                    confirmLabel="حذف نهائي"
                    title="حذف الملاحظة الداخلية"
                    description="سيتم حذف هذه الملاحظة الداخلية من الطلب."
                    itemName={note.note}
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="size-4" />}
                  />
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-7 text-oud-ink">{note.note}</p>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Timeline({ order }: { order: AdminOrderDetail }) {
  return (
    <Card className="p-4 shadow-none sm:p-5">
      <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">سجل الطلب</h2>
      <div className="mt-5 space-y-4">
        {order.events.map((event) => (
          <div key={event.id} className="relative border-s border-oud-gold/40 ps-4">
            <span className="absolute -right-[5px] top-1 size-2.5 rounded-full bg-oud-gold" />
            <p className="text-sm font-semibold text-oud-brown">
              {event.title || getOrderEventLabel(event.event_type)}
            </p>
            <p className="mt-1 text-xs text-oud-muted">
              {formatDateTime(event.created_at)}
              {event.admin_name ? ` · ${event.admin_name}` : ""}
            </p>
            {event.old_status || event.new_status ? (
              <p className="mt-1 text-xs text-oud-muted">
                {getOrderStatusLabel(event.old_status)} ← {getOrderStatusLabel(event.new_status)}
              </p>
            ) : null}
            {event.description ? (
              <p className="mt-2 text-sm leading-7 text-oud-muted">{event.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

function PrintableInvoice({
  order,
  address
}: {
  order: AdminOrderDetail;
  address: ReturnType<typeof parseAddressSnapshot>;
}) {
  return (
    <section className="order-print-section order-print-invoice hidden">
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>فاتورة طلب</h1>
      <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
        <p>عود ياز</p>
        <p dir="ltr">{order.order_number}</p>
        <p>{formatDateTime(order.created_at)}</p>
        <p>
          العميل: {order.customer_name_snapshot} - <span dir="ltr">{order.customer_phone_snapshot}</span>
        </p>
      </div>
      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <PrintTh>المنتج</PrintTh>
            <PrintTh>الكمية</PrintTh>
            <PrintTh>السعر</PrintTh>
            <PrintTh>الإجمالي</PrintTh>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item) => (
            <tr key={item.id}>
              <PrintTd>{item.product_name_ar_snapshot}</PrintTd>
              <PrintTd>{item.quantity}</PrintTd>
              <PrintTd>{formatMoney(item.unit_price_omr)}</PrintTd>
              <PrintTd>{formatMoney(item.line_total_omr)}</PrintTd>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24, display: "grid", gap: 8, maxWidth: 260 }}>
        <PrintTotal label="المجموع الفرعي" value={order.subtotal_omr} />
        <PrintTotal label="التوصيل" value={order.delivery_fee_omr} />
        <PrintTotal label="الخصم" value={order.discount_omr} />
        <PrintTotal label="الضريبة" value={order.tax_omr} />
        <PrintTotal label="الإجمالي" value={order.total_omr} strong />
      </div>
      <p style={{ marginTop: 24 }}>
        العنوان: {address.country}، {address.governorate}، {address.wilayat}، {address.address_line_1}
      </p>
    </section>
  );
}

function PrintableShippingLabel({
  order,
  address
}: {
  order: AdminOrderDetail;
  address: ReturnType<typeof parseAddressSnapshot>;
}) {
  return (
    <section className="order-print-section order-print-shipping-label hidden">
      <div style={{ border: "2px solid #23160f", padding: 24, maxWidth: 620 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>بوليصة شحن</h1>
        <p style={{ marginTop: 12, fontSize: 20 }} dir="ltr">
          {order.order_number}
        </p>
        <div style={{ marginTop: 24, display: "grid", gap: 10, fontSize: 17 }}>
          <p>المستلم: {order.customer_name_snapshot}</p>
          <p>
            الهاتف: <span dir="ltr">{order.customer_phone_snapshot}</span>
          </p>
          <p>
            العنوان: {address.country}، {address.governorate}، {address.wilayat}
            {address.area ? `، ${address.area}` : ""}
          </p>
          <p>{address.address_line_1}</p>
          {address.delivery_notes ? <p>ملاحظات: {address.delivery_notes}</p> : null}
          <p>طريقة الدفع: {paymentMethodLabels[order.payment_method]}</p>
          <p>المبلغ: {formatMoney(order.total_omr)}</p>
        </div>
      </div>
    </section>
  );
}

function PrintTh({ children }: { children: React.ReactNode }) {
  return <th style={{ border: "1px solid #ddd", padding: 10, textAlign: "right" }}>{children}</th>;
}

function PrintTd({ children }: { children: React.ReactNode }) {
  return <td style={{ border: "1px solid #ddd", padding: 10 }}>{children}</td>;
}

function PrintTotal({
  label,
  value,
  strong = false
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  dir
}: {
  label: string;
  value: React.ReactNode;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-oud bg-oud-beige/35 p-3">
      <p className="text-xs text-oud-muted">{label}</p>
      <div className="mt-1 break-words font-semibold text-oud-brown" dir={dir}>
        {value}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-oud-muted">{label}</span>
      {value}
    </div>
  );
}

function getStatusBadgeVariant(status: AdminOrderDetail["status"]) {
  if (status === "completed" || status === "confirmed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  return "gold";
}

function isOpenReturnStatus(status: OrderReturnSummary["status"]) {
  return openReturnStatuses.includes(status);
}

function getReturnStatusBadgeClass(status: OrderReturnSummary["status"]) {
  if (status === "requested") {
    return "border-oud-gold/40 bg-oud-gold/15 text-oud-brown";
  }

  if (status === "approved") {
    return "border-blue-900/15 bg-blue-900/10 text-blue-900";
  }

  if (status === "received") {
    return "border-purple-900/15 bg-purple-900/10 text-purple-900";
  }

  if (status === "refunded") {
    return "border-green-900/15 bg-green-900/10 text-green-900";
  }

  if (status === "rejected") {
    return "border-red-900/15 bg-red-900/10 text-red-900";
  }

  return "border-gray-500/20 bg-gray-500/10 text-gray-700";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-OM", {
    style: "currency",
    currency: "OMR",
    minimumFractionDigits: 3
  }).format(value);
}

function parseAddressSnapshot(snapshot: AdminOrderDetail["delivery_address_snapshot"]) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {
      country: "غير محدد",
      governorate: "غير محدد",
      wilayat: "غير محدد",
      area: null,
      address_line_1: "غير محدد",
      delivery_method_label: null,
      delivery_notes: null
    };
  }

  return {
    country: toDisplayText(snapshot.country),
    governorate: toDisplayText(snapshot.governorate),
    wilayat: toDisplayText(snapshot.wilayat),
    area: toNullableDisplayText(snapshot.area),
    address_line_1: toDisplayText(snapshot.address_line_1),
    delivery_method_label: toNullableDisplayText(snapshot.delivery_method_label),
    delivery_notes: toNullableDisplayText(snapshot.delivery_notes)
  };
}

function toDisplayText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : "غير محدد";
}

function toNullableDisplayText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
