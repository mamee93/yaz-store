import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomersTable } from "@/components/admin/customers-table";
import { Button, Input } from "@/components/ui";
import { getAdminCustomers } from "@/features/customers/queries";

type AdminCustomersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function AdminCustomersPage({ searchParams }: AdminCustomersPageProps) {
  const params = await searchParams;
  const customers = await getAdminCustomers(params.q);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="العملاء"
        title="إدارة العملاء"
        description="عرض العملاء الحقيقيين من الطلبات، بيانات التواصل، إجمالي الشراء، وآخر نشاط."
        action={<CustomerSearchForm defaultValue={params.q} />}
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <CustomersTable customers={customers} />
    </div>
  );
}

function CustomerSearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/admin/customers" className="flex w-full flex-col gap-2 sm:w-80 sm:flex-row">
      <Input
        name="q"
        defaultValue={defaultValue ?? ""}
        placeholder="بحث بالاسم أو الهاتف أو البريد"
        aria-label="بحث العملاء"
        className="bg-white"
      />
      <Button type="submit" variant="secondary">
        بحث
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
