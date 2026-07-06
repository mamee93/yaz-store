import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { softDeleteProductAction, updateProductAction } from "@/features/products/actions";
import { getAdminCategories } from "@/features/categories/queries";
import { getAdminProductById } from "@/features/products/queries";

type AdminEditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminEditProductPage({
  params,
  searchParams
}: AdminEditProductPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories()
  ]);

  if (!product) {
    notFound();
  }

  const updateAction = updateProductAction.bind(null, product.id);
  const deleteAction = softDeleteProductAction.bind(null, product.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="المنتجات"
        title="تعديل المنتج"
        description={`تحديث بيانات ${product.name_ar} في الكتالوج والمخزون وظهور المتجر.`}
      />
      <AdminStatusMessage
        status={resolvedSearchParams.status}
        message={resolvedSearchParams.message}
      />
      <ProductForm
        mode="edit"
        product={product}
        categories={categories}
        action={updateAction}
        deleteAction={deleteAction}
      />
      <ProductImageUploader productId={product.id} images={product.product_images ?? []} />
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
