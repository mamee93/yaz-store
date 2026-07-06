import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CategoryManagement } from "@/components/admin/category-management";
import { getAdminCategories } from "@/features/categories/queries";

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  const [categories, params] = await Promise.all([getAdminCategories(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="التصنيفات"
        title="إدارة التصنيفات"
        description="إنشاء وتعديل تصنيفات المتجر وترتيب ظهورها في الواجهة."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <CategoryManagement categories={categories} />
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
