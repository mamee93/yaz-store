import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductTable } from "@/components/admin/product-table";
import { getAdminProducts } from "@/features/products/queries";

type AdminProductsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const [products, params] = await Promise.all([getAdminProducts(), searchParams]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="المنتجات"
        title="إدارة المنتجات"
        description="إدارة كتالوج عود ياز من المنتجات النشطة والمسودات والمخزون والأسعار."
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory"
          >
            <Plus className="size-4" aria-hidden="true" />
            إضافة منتج
          </Link>
        }
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <ProductTable products={products} />
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
