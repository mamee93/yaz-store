import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductTable } from "@/components/admin/product-table";
import { getProductStockStatus, type ProductStockStatus } from "@/features/inventory/stock-status";
import { getAdminProducts, type ProductRow } from "@/features/products/queries";

type ProductFilter = "all" | ProductStockStatus;
type ProductSort = "quantity_asc" | "quantity_desc" | "newest" | "name";

type AdminProductsPageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
    stockStatus?: string;
    sort?: string;
  }>;
};

const filters: Array<{ value: ProductFilter; label: string }> = [
  { value: "all", label: "\u0627\u0644\u0643\u0644" },
  { value: "low_stock", label: "\u0645\u062e\u0632\u0648\u0646 \u0645\u0646\u062e\u0641\u0636" },
  { value: "out_of_stock", label: "\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646" },
  { value: "not_tracked", label: "\u063a\u064a\u0631 \u0645\u062a\u062a\u0628\u0639" },
  { value: "in_stock", label: "\u0645\u062a\u0648\u0641\u0631" }
];

const sorts: Array<{ value: ProductSort; label: string }> = [
  { value: "quantity_asc", label: "\u0627\u0644\u0623\u0642\u0644 \u0643\u0645\u064a\u0629" },
  { value: "quantity_desc", label: "\u0627\u0644\u0623\u0639\u0644\u0649 \u0643\u0645\u064a\u0629" },
  { value: "newest", label: "\u0627\u0644\u0623\u062d\u062f\u062b" },
  { value: "name", label: "\u0627\u0644\u0627\u0633\u0645" }
];

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const [products, params] = await Promise.all([getAdminProducts(), searchParams]);
  const activeFilter = normalizeFilter(params.stockStatus);
  const activeSort = normalizeSort(params.sort);
  const visibleProducts = sortProducts(filterProducts(products, activeFilter), activeSort);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={"\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a"}
        title={"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a"}
        description={"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c \u0648\u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631."}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory"
          >
            <Plus className="size-4" aria-hidden="true" />
            {"\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062a\u062c"}
          </Link>
        }
      />
      <AdminStatusMessage status={params.status} message={params.message} />
      <div className="rounded-oud border border-oud-brown/10 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <FilterLink key={filter.value} label={filter.label} params={{ stockStatus: filter.value, sort: activeSort }} active={activeFilter === filter.value} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sorts.map((sort) => (
            <FilterLink key={sort.value} label={sort.label} params={{ stockStatus: activeFilter, sort: sort.value }} active={activeSort === sort.value} />
          ))}
        </div>
      </div>
      <ProductTable products={visibleProducts} />
    </div>
  );
}

function FilterLink({ label, params, active }: { label: string; params: { stockStatus: string; sort: string }; active: boolean }) {
  const query = new URLSearchParams(params);

  return (
    <Link
      href={`/admin/products?${query.toString()}`}
      className={
        active
          ? "inline-flex h-9 items-center rounded-full bg-oud-brown px-4 text-xs font-bold text-oud-ivory"
          : "inline-flex h-9 items-center rounded-full border border-oud-brown/10 bg-oud-pearl px-4 text-xs font-bold text-oud-brown transition hover:bg-oud-beige/40"
      }
    >
      {label}
    </Link>
  );
}

function filterProducts(products: ProductRow[], filter: ProductFilter) {
  if (filter === "all") {
    return products;
  }

  return products.filter((product) => getProductStockStatus(product) === filter);
}

function sortProducts(products: ProductRow[], sort: ProductSort) {
  const sorted = [...products];

  if (sort === "quantity_desc") {
    return sorted.sort((a, b) => b.stock_quantity - a.stock_quantity);
  }

  if (sort === "name") {
    return sorted.sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
  }

  if (sort === "newest") {
    return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return sorted.sort((a, b) => a.stock_quantity - b.stock_quantity);
}

function normalizeFilter(value: string | undefined): ProductFilter {
  return filters.some((filter) => filter.value === value) ? (value as ProductFilter) : "all";
}

function normalizeSort(value: string | undefined): ProductSort {
  return sorts.some((sort) => sort.value === value) ? (value as ProductSort) : "quantity_asc";
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