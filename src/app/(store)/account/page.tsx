import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  CreditCard,
  FileText,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Settings,
  ShoppingBag,
  Truck
} from "lucide-react";
import { CustomerLogoutButton } from "@/components/auth/customer-logout-button";
import { Badge, Card, Container, EmptyState, Heading, Price, Section } from "@/components/ui";
import {
  customerOrderStatusLabels,
  customerPaymentMethodLabels,
  getCustomerOrderStatusVariant
} from "@/features/orders/customer-labels";
import {
  getCustomerAccountOverview,
  type CustomerAccountOverview,
  type CustomerNotificationItem,
  type CustomerOrderRow,
  type CustomerReturnOverviewItem
} from "@/features/customers/queries";
import { RETURN_WINDOW_DAYS, getReturnStatusVariant, returnStatusLabels, returnTypeLabels } from "@/features/returns/labels";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

type CustomerReturn = CustomerReturnOverviewItem;
type CustomerNotification = CustomerNotificationItem;

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [params, overview] = await Promise.all([searchParams, getCustomerAccountOverview()]);

  if (!overview) {
    redirect("/login?message=يرجى تسجيل الدخول للوصول إلى حسابك.");
  }

  const profile = overview.profile;

  return (
    <main dir="rtl">
      <Section className="pb-6">
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="حسابي"
            description="لوحة واحدة لمتابعة الطلبات والفواتير والمرتجعات والإشعارات وبيانات التوصيل."
          >
            مرحبًا {profile?.full_name ?? "بك"}
          </Heading>
          <AccountStatusMessage status={params.status} message={params.message} />
          <AccountNav />
          <AccountHeader profile={profile} />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard icon={<ShoppingBag className="size-5" />} label="إجمالي الطلبات" value={overview.kpis.totalOrders} />
            <KpiCard icon={<Truck className="size-5" />} label="قيد التنفيذ" value={overview.kpis.activeOrders} />
            <KpiCard icon={<PackageCheck className="size-5" />} label="مكتملة" value={overview.kpis.completedOrders} />
            <KpiCard
              icon={<CreditCard className="size-5" />}
              label="إجمالي المشتريات"
              value={<Price value={overview.kpis.totalPurchasesOmr} />}
            />
            <KpiCard icon={<RefreshCcw className="size-5" />} label="طلبات الإرجاع" value={overview.kpis.returnsCount} />
            <KpiCard icon={<Bell className="size-5" />} label="إشعارات جديدة" value={overview.kpis.unreadNotifications} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.8fr)]">
            <div className="space-y-6">
              <RecentOrders orders={overview.recentOrders} returns={overview.recentReturns} />
              <RecentReturns returns={overview.recentReturns} />
            </div>
            <div className="space-y-6">
              <DeliverySummary profile={profile} complete={overview.deliveryProfileComplete} />
              <RecentNotifications notifications={overview.recentNotifications.slice(0, 5)} />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function AccountHeader({ profile }: { profile: CustomerAccountOverview["profile"] }) {
  const name = profile?.full_name || "عميل عود ياز";
  const initial = name.trim().charAt(0) || "ع";

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="flex flex-col gap-5 bg-gradient-to-l from-oud-brown to-oud-coffee p-5 text-oud-ivory sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border border-oud-gold/40 bg-oud-gold/15 text-2xl font-bold text-oud-gold">
            {initial}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold">{name}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-oud-ivory/80">
              <span dir="ltr">{profile?.email ?? "لا يوجد بريد"}</span>
              <span>•</span>
              <span dir="ltr">{profile?.phone || "لا يوجد هاتف"}</span>
              <span>•</span>
              <span>منذ {formatDate(profile?.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Badge variant="gold">حساب نشط</Badge>
          <AccountLink href="/account/profile">
            <Settings className="size-4" />
            تعديل البيانات
          </AccountLink>
          <CustomerLogoutButton className="border-white/20 bg-white/10 text-oud-ivory hover:bg-white/15" />
        </div>
      </div>
    </Card>
  );
}

function AccountNav() {
  const links = [
    ["نظرة عامة", "/account"],
    ["طلباتي", "/account/orders"],
    ["بياناتي", "/account/profile"],
    ["المرتجعات", "/account#returns"],
    ["الإشعارات", "/account/notifications"],
    ["سياسة الاسترجاع", "/returns-policy"]
  ] as const;

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {links.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="shrink-0 rounded-oud border border-oud-brown/10 bg-white px-4 py-2 text-sm font-semibold text-oud-brown hover:bg-oud-beige/35"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function KpiCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">{icon}</span>
        <div>
          <p className="text-xs text-oud-muted">{label}</p>
          <div className="mt-1 text-xl font-bold text-oud-brown">{value}</div>
        </div>
      </div>
    </Card>
  );
}

function RecentOrders({ orders, returns }: { orders: CustomerOrderRow[]; returns: CustomerReturn[] }) {
  return (
    <DashboardSection
      title="طلباتي الأخيرة"
      action={<AccountLink href="/account/orders">عرض جميع الطلبات</AccountLink>}
    >
      {orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات بعد" description="ستظهر طلباتك هنا بعد إتمام أول طلب." icon={<ShoppingBag className="size-5" />} />
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} canRequestReturn={canRequestReturn(order, returns)} />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function OrderCard({ order, canRequestReturn }: { order: CustomerOrderRow; canRequestReturn: boolean }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-oud-brown" dir="ltr">{order.order_number}</p>
          <p className="mt-1 text-xs text-oud-muted">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getCustomerOrderStatusVariant(order.status)}>
            {customerOrderStatusLabels[order.status]}
          </Badge>
          <Price value={order.total_omr} />
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-oud-muted sm:grid-cols-2">
        <span>طريقة الدفع: {customerPaymentMethodLabels[order.payment_method]}</span>
        <span dir="ltr">الفاتورة: {order.invoice_number ?? "غير متوفرة"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <AccountLink href={`/account/orders/${order.id}`}>عرض التفاصيل</AccountLink>
        <AccountLink href={`/account/orders/${order.id}`}>تتبع الطلب</AccountLink>
        {order.invoice_id ? <AccountLink href={`/account/orders/${order.id}/invoice.pdf`}>تحميل الفاتورة</AccountLink> : null}
        {canRequestReturn ? <AccountLink href={`/account/orders/${order.id}/return`}>طلب إرجاع أو استبدال</AccountLink> : null}
      </div>
    </div>
  );
}

function DeliverySummary({
  profile,
  complete
}: {
  profile: CustomerAccountOverview["profile"];
  complete: boolean;
}) {
  return (
    <DashboardSection
      title="بيانات التوصيل"
      action={<AccountLink href="/account/profile">تعديل بيانات التوصيل</AccountLink>}
    >
      {!complete ? (
        <EmptyState
          title="أكمل بيانات التوصيل"
          description="أكمل بيانات التوصيل لتسريع إتمام الطلبات القادمة."
          icon={<MapPin className="size-5" />}
        />
      ) : (
        <div className="grid gap-3 text-sm">
          <Info label="الاسم" value={profile?.full_name} />
          <Info label="الهاتف" value={profile?.phone} dir="ltr" />
          <Info label="المحافظة" value={profile?.governorate} />
          <Info label="الولاية" value={profile?.wilayat} />
          <Info label="المنطقة" value={profile?.area} />
          <Info label="العنوان التفصيلي" value={profile?.detailed_address} />
        </div>
      )}
    </DashboardSection>
  );
}

function RecentReturns({ returns }: { returns: CustomerReturn[] }) {
  return (
    <DashboardSection title="طلبات الإرجاع والاستبدال" id="returns">
      {returns.length === 0 ? (
        <p className="rounded-oud bg-oud-beige/25 p-4 text-sm text-oud-muted">
          لا توجد طلبات إرجاع أو استبدال حتى الآن.
        </p>
      ) : (
        <div className="grid gap-3">
          {returns.map((item) => (
            <div key={item.id} className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-oud-brown" dir="ltr">{item.order_number}</p>
                  <p className="mt-1 text-xs text-oud-muted">{formatDate(item.requested_at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={getReturnStatusVariant(item.status)}>{returnStatusLabels[item.status]}</Badge>
                  <Badge variant="soft">{returnTypeLabels[item.return_type]}</Badge>
                  <Price value={item.refund_amount_omr ?? item.expected_refund_omr} />
                </div>
              </div>
              <div className="mt-3">
                <AccountLink href={`/account/returns/${item.id}`}>عرض التفاصيل</AccountLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function RecentNotifications({ notifications }: { notifications: CustomerNotification[] }) {
  return (
    <DashboardSection
      title="آخر الإشعارات"
      action={<AccountLink href="/account/notifications">عرض جميع الإشعارات</AccountLink>}
    >
      {notifications.length === 0 ? (
        <p className="rounded-oud bg-oud-beige/25 p-4 text-sm text-oud-muted">لا توجد إشعارات حتى الآن.</p>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-oud-brown">{notification.title}</h3>
                <Badge variant={notification.is_read ? "soft" : "gold"}>
                  {notification.is_read ? "مقروء" : "جديد"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-7 text-oud-muted">{notification.message}</p>
              <p className="mt-2 text-xs text-oud-muted">{formatDate(notification.created_at)}</p>
              {notification.link ? <div className="mt-3"><AccountLink href={notification.link}>فتح الرابط</AccountLink></div> : null}
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}

function DashboardSection({ title, action, children, id }: { title: string; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Card id={id} className="p-4 shadow-none sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-bold text-oud-brown sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Info({ label, value, dir }: { label: string; value?: string | null; dir?: "rtl" | "ltr" }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-white p-3">
      <p className="text-xs text-oud-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-oud-brown" dir={dir}>{value || "-"}</p>
    </div>
  );
}

function AccountLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-oud-brown/15 bg-white px-3 py-2 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/35"
    >
      {children}
    </Link>
  );
}

function AccountStatusMessage({ status, message }: { status?: string; message?: string }) {
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

function canRequestReturn(order: CustomerOrderRow, returns: CustomerReturn[]) {
  if (order.status !== "completed") {
    return false;
  }

  if (returns.some((item) => item.order_id === order.id && item.status !== "rejected" && item.status !== "closed")) {
    return false;
  }

  const completedAt = order.completed_at ?? order.updated_at ?? order.created_at;
  const ageMs = Date.now() - new Date(completedAt).getTime();
  return ageMs <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ar-OM", {
    dateStyle: "medium"
  }).format(new Date(value));
}
