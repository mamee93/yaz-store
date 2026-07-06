import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CouponStatsCards } from "@/components/admin/coupon-stats-cards";
import { CouponsTable } from "@/components/admin/coupons-table";
import { Button, Input, Select } from "@/components/ui";
import {
  getAdminCoupons,
  getAdminCouponsStats,
  type CouponFilter
} from "@/features/coupons/queries";

type AdminCouponsPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: CouponFilter;
    status?: string;
    message?: string;
  }>;
};

const filters: CouponFilter[] = ["all", "active", "inactive", "expired"];

export default async function AdminCouponsPage({ searchParams }: AdminCouponsPageProps) {
  const params = await searchParams;
  const filter = filters.includes(params.filter ?? "all") ? (params.filter ?? "all") : "all";
  const [coupons, stats] = await Promise.all([
    getAdminCoupons({ search: params.q, filter }),
    getAdminCouponsStats()
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الكوبونات"
        title="إدارة الكوبونات والخصومات"
        description="إنشاء ومتابعة كوبونات الخصم، حدود الاستخدام، تواريخ الانتهاء، وحالة التفعيل."
        action={
          <Link href="/admin/coupons/new">
            <Button leftIcon={<Plus className="size-4" />}>إضافة كوبون</Button>
          </Link>
        }
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <CouponStatsCards stats={stats} />
      <CouponSearchForm defaultSearch={params.q} defaultFilter={filter} />
      <CouponsTable coupons={coupons} />
    </div>
  );
}

function CouponSearchForm({
  defaultSearch,
  defaultFilter
}: {
  defaultSearch?: string;
  defaultFilter: CouponFilter;
}) {
  return (
    <form
      action="/admin/coupons"
      className="grid gap-3 rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-none md:grid-cols-[1fr_14rem_auto]"
    >
      <Input
        name="q"
        defaultValue={defaultSearch ?? ""}
        placeholder="بحث بالكود أو الاسم"
        aria-label="بحث الكوبونات"
        className="bg-white"
      />
      <Select
        name="filter"
        defaultValue={defaultFilter}
        aria-label="تصفية الكوبونات"
        className="bg-white"
      >
        <option value="all">كل الحالات</option>
        <option value="active">نشط ومجدول</option>
        <option value="inactive">متوقف أو مكتمل</option>
        <option value="expired">منتهي</option>
      </Select>
      <Button type="submit" variant="secondary">
        تطبيق
      </Button>
    </form>
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
