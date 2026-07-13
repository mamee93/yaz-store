import Link from "next/link";
import { Edit, PackagePlus, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card, Input } from "@/components/ui";
import { restockProductAction } from "@/features/inventory/actions";
import {
  getInventoryAlertProducts,
  type InventoryAlertFilter,
  type InventoryAlertSort
} from "@/features/inventory/queries";
import { getStockStatusLabel, type ProductStockStatus } from "@/features/inventory/stock-status";

type AlertsPageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    sort?: string;
    page?: string;
    status?: string;
    message?: string;
  }>;
};

const filters: Array<{ value: InventoryAlertFilter; label: string }> = [
  { value: "all", label: "\u0627\u0644\u0643\u0644" },
  { value: "low_stock", label: "\u0645\u062e\u0632\u0648\u0646 \u0645\u0646\u062e\u0641\u0636" },
  { value: "out_of_stock", label: "\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646" },
  { value: "not_tracked", label: "\u063a\u064a\u0631 \u0645\u062a\u062a\u0628\u0639" },
  { value: "in_stock", label: "\u0645\u062a\u0648\u0641\u0631" }
];

const sorts: Array<{ value: InventoryAlertSort; label: string }> = [
  { value: "quantity_asc", label: "\u0627\u0644\u0623\u0642\u0644 \u0643\u0645\u064a\u0629" },
  { value: "quantity_desc", label: "\u0627\u0644\u0623\u0639\u0644\u0649 \u0643\u0645\u064a\u0629" },
  { value: "newest", label: "\u0627\u0644\u0623\u062d\u062f\u062b" },
  { value: "name", label: "\u0627\u0644\u0627\u0633\u0645" }
];

export default async function InventoryAlertsPage({ searchParams }: AlertsPageProps) {
  const params = await searchParams;
  const filter = normalizeFilter(params.filter);
  const sort = normalizeSort(params.sort);
  const q = params.q ?? "";
  const page = Number(params.page ?? 1);
  const result = await getInventoryAlertProducts({ query: q, filter, sort, page });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={"\u0627\u0644\u0645\u062e\u0632\u0648\u0646"}
        title={"\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0648\u0646"}
        description={"\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0645\u0646\u062e\u0641\u0636\u0629 \u0648\u0627\u0644\u0646\u0627\u0641\u062f\u0629 \u0648\u062d\u062f\u0648\u062f \u0627\u0644\u062a\u0646\u0628\u064a\u0647."}
      />
      <StatusMessage status={params.status} message={params.message} />

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label={"\u0645\u0646\u062e\u0641\u0636 \u0627\u0644\u0645\u062e\u0632\u0648\u0646"} value={result.summary.lowStock} tone="gold" />
        <Kpi label={"\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646"} value={result.summary.outOfStock} tone="danger" />
        <Kpi label={"\u063a\u064a\u0631 \u0645\u062a\u062a\u0628\u0639"} value={result.summary.notTracked} tone="soft" />
        <Kpi label={"\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u062a\u062a\u0628\u0639"} value={result.summary.trackedTotal} tone="success" />
      </div>

      <Card className="space-y-4 p-4 shadow-none">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input name="q" defaultValue={q} placeholder={"\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062a\u062c \u0623\u0648 SKU"} />
          <input type="hidden" name="filter" value={filter} />
          <input type="hidden" name="sort" value={sort} />
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-oud bg-oud-brown px-5 text-sm font-bold text-oud-ivory" type="submit">
            <Search className="size-4" />
            {"\u0628\u062d\u062b"}
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <ToolbarLink key={item.value} label={item.label} params={{ q, filter: item.value, sort }} active={filter === item.value} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {sorts.map((item) => (
            <ToolbarLink key={item.value} label={item.label} params={{ q, filter, sort: item.value }} active={sort === item.value} />
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[68rem] text-right text-sm">
            <thead className="bg-oud-beige/35 text-xs text-oud-muted">
              <tr>
                <th className="px-5 py-3">{"\u0627\u0644\u0645\u0646\u062a\u062c"}</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">{"\u0627\u0644\u0643\u0645\u064a\u0629"}</th>
                <th className="px-5 py-3">{"\u062d\u062f \u0627\u0644\u062a\u0646\u0628\u064a\u0647"}</th>
                <th className="px-5 py-3">{"\u0627\u0644\u062d\u0627\u0644\u0629"}</th>
                <th className="px-5 py-3">{"\u0622\u062e\u0631 \u062a\u062d\u062f\u064a\u062b"}</th>
                <th className="px-5 py-3">{"\u0625\u062c\u0631\u0627\u0621"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oud-brown/10">
              {result.products.length > 0 ? result.products.map((product) => {
                const restockAction = restockProductAction.bind(null, product.id);

                return (
                  <tr key={product.id} className="bg-oud-pearl">
                    <td className="px-5 py-4 font-semibold text-oud-brown">{product.name_ar}</td>
                    <td className="px-5 py-4 text-oud-muted" dir="ltr">{product.sku ?? "-"}</td>
                    <td className="px-5 py-4 font-semibold text-oud-brown">{product.stock_quantity}</td>
                    <td className="px-5 py-4 text-oud-muted">{product.low_stock_threshold}</td>
                    <td className="px-5 py-4"><Badge variant={badgeVariant(product.stockStatus)}>{getStockStatusLabel(product.stockStatus)}</Badge></td>
                    <td className="px-5 py-4 text-oud-muted">{formatDate(product.updated_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/admin/products/${product.id}/edit`} className="inline-flex items-center gap-2 text-xs font-bold text-oud-brown">
                          <Edit className="size-4" />
                          {"\u062a\u0639\u062f\u064a\u0644"}
                        </Link>
                        <form action={restockAction} className="flex items-center gap-2">
                          <input name="quantity" type="number" min="1" defaultValue="1" className="h-9 w-20 rounded-oud border border-oud-brown/15 bg-white px-2 text-sm" />
                          <input name="reason" type="hidden" value="Inventory alert restock" />
                          <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-oud bg-oud-brown px-3 text-xs font-bold text-oud-ivory">
                            <PackagePlus className="size-4" />
                            {"\u0625\u0636\u0627\u0641\u0629 \u0645\u062e\u0632\u0648\u0646"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-oud-muted">{"\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-oud-muted">
        <span>{"\u0627\u0644\u0635\u0641\u062d\u0629"} {result.page} / {result.pageCount}</span>
        <div className="flex gap-2">
          {result.page > 1 ? <PageLink label={"\u0627\u0644\u0633\u0627\u0628\u0642"} page={result.page - 1} q={q} filter={filter} sort={sort} /> : null}
          {result.page < result.pageCount ? <PageLink label={"\u0627\u0644\u062a\u0627\u0644\u064a"} page={result.page + 1} q={q} filter={filter} sort={sort} /> : null}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: "gold" | "danger" | "soft" | "success" }) {
  return (
    <Card className="p-4 shadow-none">
      <p className="text-xs font-semibold text-oud-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-oud-brown">{value}</p>
      <Badge variant={tone} className="mt-3">{label}</Badge>
    </Card>
  );
}

function ToolbarLink({ label, params, active }: { label: string; params: Record<string, string>; active: boolean }) {
  const query = new URLSearchParams(params);
  return <Link href={`/admin/inventory/alerts?${query.toString()}`} className={active ? "inline-flex h-9 items-center rounded-full bg-oud-brown px-4 text-xs font-bold text-oud-ivory" : "inline-flex h-9 items-center rounded-full border border-oud-brown/10 bg-oud-pearl px-4 text-xs font-bold text-oud-brown"}>{label}</Link>;
}

function PageLink({ label, page, q, filter, sort }: { label: string; page: number; q: string; filter: string; sort: string }) {
  const query = new URLSearchParams({ q, filter, sort, page: String(page) });
  return <Link href={`/admin/inventory/alerts?${query.toString()}`} className="rounded-oud border border-oud-brown/10 bg-white px-3 py-2 font-bold text-oud-brown">{label}</Link>;
}

function badgeVariant(status: ProductStockStatus) {
  if (status === "out_of_stock") return "danger";
  if (status === "low_stock") return "gold";
  if (status === "not_tracked") return "soft";
  return "success";
}

function normalizeFilter(value: string | undefined): InventoryAlertFilter {
  return filters.some((item) => item.value === value) ? (value as InventoryAlertFilter) : "all";
}

function normalizeSort(value: string | undefined): InventoryAlertSort {
  return sorts.some((item) => item.value === value) ? (value as InventoryAlertSort) : "quantity_asc";
}

function StatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) return null;
  return <div className={status === "error" ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-bold text-red-900" : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-bold text-green-900"}>{message}</div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-OM", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}