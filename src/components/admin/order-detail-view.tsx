import Image from "next/image";
import { Save } from "lucide-react";
import { Badge, Button, Card, Price, Textarea } from "@/components/ui";
import { updateOrderAction } from "@/features/orders/actions";
import type { AdminOrderDetail } from "@/features/orders/queries";
import { OrderStatusSelect, orderStatusLabels } from "./order-status-select";

type OrderDetailViewProps = {
  order: AdminOrderDetail;
};

const paymentMethodLabels = {
  cash_on_delivery: "الدفع عند الاستلام",
  bank_transfer: "التحويل البنكي",
  manual_confirmation: "تأكيد يدوي",
  tap_payments: "دفع إلكتروني"
};

const deliveryMethodLabels = {
  pickup_office: "استلام من المكتب",
  home_delivery: "توصيل للمنزل"
};

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const updateAction = updateOrderAction.bind(null, order.id);
  const address = parseAddressSnapshot(order.delivery_address_snapshot);

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <Card className="p-4 shadow-none sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-oud-muted">رقم الطلب</p>
              <h2 className="mt-1 text-2xl font-bold text-oud-brown" dir="ltr">
                {order.order_number}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusBadgeVariant(order.status)}>
                {orderStatusLabels[order.status]}
              </Badge>
              {order.stock_deducted_at ? <Badge variant="soft">تم خصم المخزون</Badge> : null}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-none">
          <div className="border-b border-oud-brown/10 p-4 sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">المنتجات</h2>
          </div>
          <div className="divide-y divide-oud-brown/10">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
                    <p className="font-semibold text-oud-brown">
                      {item.product_name_ar_snapshot}
                    </p>
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
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">عنوان التوصيل</h2>
          <div className="mt-4 space-y-2 text-sm leading-7 text-oud-muted">
            <p>{address.country}، {address.governorate}، {address.wilayat}</p>
            {address.area ? <p>{address.area}</p> : null}
            <p>{address.address_line_1}</p>
            {address.delivery_notes ? <p>ملاحظات: {address.delivery_notes}</p> : null}
          </div>
        </Card>

        {order.customer_notes ? (
          <Card className="p-4 shadow-none sm:p-5">
            <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">ملاحظات العميل</h2>
            <p className="mt-4 text-sm leading-7 text-oud-muted">{order.customer_notes}</p>
          </Card>
        ) : null}
      </div>

      <aside className="space-y-5">
        <Card className="p-4 shadow-none sm:p-5">
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">العميل</h2>
          <div className="mt-4 space-y-2 text-sm text-oud-muted">
            <p className="font-semibold text-oud-brown">{order.customer_name_snapshot}</p>
            <p dir="ltr">{order.customer_phone_snapshot}</p>
            <p>{paymentMethodLabels[order.payment_method]}</p>
            {order.delivery_method ? <p>{deliveryMethodLabels[order.delivery_method]}</p> : null}
          </div>
        </Card>

        <Card className="p-4 shadow-none sm:p-5">
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">الإجماليات</h2>
          <div className="mt-4 space-y-3 text-sm">
            <SummaryRow label="المجموع الفرعي" value={<Price value={order.subtotal_omr} />} />
            <SummaryRow label="التوصيل" value={<Price value={order.delivery_fee_omr} />} />
            <SummaryRow label="الخصم" value={<Price value={order.discount_omr} />} />
            <SummaryRow label="الإجمالي" value={<Price value={order.total_omr} className="text-lg" />} />
          </div>
        </Card>

        <Card className="p-4 shadow-none sm:p-5">
          <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">إدارة الطلب</h2>
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
        </Card>
      </aside>
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

function parseAddressSnapshot(snapshot: AdminOrderDetail["delivery_address_snapshot"]) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return {
      country: "غير محدد",
      governorate: "غير محدد",
      wilayat: "غير محدد",
      area: null,
      address_line_1: "غير محدد",
      delivery_notes: null
    };
  }

  return {
    country: toDisplayText(snapshot.country),
    governorate: toDisplayText(snapshot.governorate),
    wilayat: toDisplayText(snapshot.wilayat),
    area: toNullableDisplayText(snapshot.area),
    address_line_1: toDisplayText(snapshot.address_line_1),
    delivery_notes: toNullableDisplayText(snapshot.delivery_notes)
  };
}

function toDisplayText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : "غير محدد";
}

function toNullableDisplayText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
