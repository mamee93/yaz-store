import { Mail, MapPin, Phone, Save } from "lucide-react";
import { Badge, Button, Card, Textarea } from "@/components/ui";
import { updateCustomerNotesAction } from "@/features/customers/actions";
import type { AdminCustomerDetail, CustomerAddressRow } from "@/features/customers/queries";
import { CustomerOrdersTable } from "./customer-orders-table";
import { CustomerStatsCards } from "./customer-stats-cards";

type CustomerDetailViewProps = {
  customer: AdminCustomerDetail;
};

export function CustomerDetailView({ customer }: CustomerDetailViewProps) {
  const updateNotesAction = updateCustomerNotesAction.bind(null, customer.id);

  return (
    <div className="space-y-5">
      <CustomerStatsCards customer={customer} />

      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Card className="p-5 shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-oud-muted">ملف العميل</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-oud-brown">
                  {customer.full_name}
                </h2>
                <p className="mt-2 text-sm text-oud-muted">
                  مسجل منذ {formatDate(customer.created_at)}
                </p>
              </div>
              <Badge variant={customer.total_orders > 0 ? "success" : "soft"}>
                {customer.total_orders > 0 ? "عميل نشط" : "بدون طلبات"}
              </Badge>
            </div>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">معلومات التواصل</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ContactRow icon={Phone} label="الهاتف" value={customer.phone} dir="ltr" />
              <ContactRow
                icon={Phone}
                label="واتساب"
                value={customer.whatsapp_number ?? "غير محدد"}
                dir="ltr"
              />
              <ContactRow
                icon={Mail}
                label="البريد الإلكتروني"
                value={customer.email ?? "غير محدد"}
                dir="ltr"
              />
            </div>
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">عناوين الشحن</h2>
            <div className="mt-4 space-y-3">
              {customer.addresses.length > 0 ? (
                customer.addresses.map((address) => (
                  <AddressCard key={address.id} address={address} />
                ))
              ) : (
                <p className="rounded-oud bg-oud-beige/35 px-4 py-3 text-sm text-oud-muted">
                  لا توجد عناوين محفوظة لهذا العميل.
                </p>
              )}
            </div>
          </Card>

          <CustomerOrdersTable orders={customer.orders} />
        </div>

        <aside className="space-y-5">
          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">آخر طلب</h2>
            {customer.last_order ? (
              <div className="mt-4 space-y-2 text-sm text-oud-muted">
                <p className="font-semibold text-oud-brown" dir="ltr">
                  {customer.last_order.order_number}
                </p>
                <p>{formatDate(customer.last_order.created_at)}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-oud-muted">لا يوجد طلب سابق.</p>
            )}
          </Card>

          <Card className="p-5 shadow-none">
            <h2 className="font-display text-2xl font-bold text-oud-brown">ملاحظات الإدارة</h2>
            <form action={updateNotesAction} className="mt-5 space-y-4">
              <Textarea
                label="ملاحظات خاصة بالعميل"
                name="notes"
                defaultValue={customer.notes ?? ""}
                rows={6}
                placeholder="مثال: يفضل التواصل عبر واتساب مساءً."
              />
              <Button type="submit" className="w-full" leftIcon={<Save className="size-4" />}>
                حفظ الملاحظات
              </Button>
            </form>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  dir
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="flex items-start gap-3 rounded-oud bg-oud-beige/35 p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-oud-gold" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-oud-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-oud-brown" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function AddressCard({ address }: { address: CustomerAddressRow }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="size-4 text-oud-gold" aria-hidden="true" />
        <p className="font-semibold text-oud-brown">
          {address.governorate}، {address.wilayat}
        </p>
        {address.is_default ? <Badge variant="gold">افتراضي</Badge> : null}
      </div>
      <div className="mt-3 space-y-1 text-sm leading-7 text-oud-muted">
        {address.area ? <p>{address.area}</p> : null}
        <p>{address.address_line_1}</p>
        {address.address_line_2 ? <p>{address.address_line_2}</p> : null}
        {address.delivery_notes ? <p>ملاحظات التوصيل: {address.delivery_notes}</p> : null}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}
