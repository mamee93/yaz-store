import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "@/features/products/actions";
import { getAdminCategories } from "@/features/categories/queries";

type AdminNewProductPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminNewProductPage({ searchParams }: AdminNewProductPageProps) {
  const [categories, params] = await Promise.all([getAdminCategories(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="المنتجات"
        title="إضافة منتج"
        description="أضف منتجاً جديداً للكتالوج مع السعر والمخزون وبيانات الظهور في المتجر."
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <ProductForm mode="new" categories={categories} action={createProductAction} />
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
