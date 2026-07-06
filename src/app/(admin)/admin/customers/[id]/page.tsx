import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerDetailView } from "@/components/admin/customer-detail-view";
import { getAdminCustomerById } from "@/features/customers/queries";

type AdminCustomerPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminCustomerPage({ params, searchParams }: AdminCustomerPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const customer = await getAdminCustomerById(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="العملاء"
        title="تفاصيل العميل"
        description={`عرض ملف العميل ${customer.full_name}، العناوين، الطلبات، وملاحظات الإدارة.`}
      />
      <AdminStatusMessage
        status={resolvedSearchParams.status}
        message={resolvedSearchParams.message}
      />
      <CustomerDetailView customer={customer} />
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
