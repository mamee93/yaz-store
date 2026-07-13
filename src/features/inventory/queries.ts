import { requireAdmin } from "@/features/auth/queries";
import {
  getProductStockStatus,
  type ProductStockStatus
} from "@/features/inventory/stock-status";
import { createClient } from "@/lib/supabase/server";

export type InventoryAlertSort = "quantity_asc" | "quantity_desc" | "newest" | "name";
export type InventoryAlertFilter =
  | "all"
  | "low_stock"
  | "out_of_stock"
  | "not_tracked"
  | "in_stock";

export type InventoryAlertProduct = {
  id: string;
  name_ar: string;
  slug: string;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  track_stock: boolean;
  is_active: boolean;
  updated_at: string;
  created_at: string;
  stockStatus: ProductStockStatus;
};

export type InventoryAlertSummary = {
  lowStock: number;
  outOfStock: number;
  notTracked: number;
  trackedTotal: number;
};

const alertSelect =
  "id,name_ar,slug,sku,stock_quantity,low_stock_threshold,track_stock,is_active,updated_at,created_at";

export async function getInventoryAlertProducts({
  query = "",
  filter = "all",
  sort = "quantity_asc",
  page = 1,
  pageSize = 25
}: {
  query?: string;
  filter?: InventoryAlertFilter;
  sort?: InventoryAlertSort;
  page?: number;
  pageSize?: number;
}) {
  const admin = await requireAdmin();

  if (!admin) {
    return {
      products: [],
      summary: getSummary([]),
      page: 1,
      pageSize,
      total: 0,
      pageCount: 1
    };
  }

  const supabase = await createClient();
  let dbQuery = supabase
    .from("products")
    .select(alertSelect)
    .is("deleted_at", null)
    .limit(500);

  if (query.trim()) {
    dbQuery = dbQuery.or(
      `name_ar.ilike.%${escapeLike(query.trim())}%,sku.ilike.%${escapeLike(query.trim())}%`
    );
  }

  if (sort === "quantity_asc") {
    dbQuery = dbQuery.order("stock_quantity", { ascending: true });
  } else if (sort === "quantity_desc") {
    dbQuery = dbQuery.order("stock_quantity", { ascending: false });
  } else if (sort === "name") {
    dbQuery = dbQuery.order("name_ar", { ascending: true });
  } else {
    dbQuery = dbQuery.order("created_at", { ascending: false });
  }

  const { data, error } = await dbQuery.returns<Omit<InventoryAlertProduct, "stockStatus">[]>();

  if (error) {
    console.error("Failed to read inventory alerts", error);
    return {
      products: [],
      summary: getSummary([]),
      page: 1,
      pageSize,
      total: 0,
      pageCount: 1
    };
  }

  const products = (data ?? []).map((product) => ({
    ...product,
    stockStatus: getProductStockStatus(product)
  }));
  const filteredProducts =
    filter === "all" ? products : products.filter((product) => product.stockStatus === filter);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const offset = (safePage - 1) * pageSize;

  return {
    products: filteredProducts.slice(offset, offset + pageSize),
    summary: getSummary(products),
    page: safePage,
    pageSize,
    total: filteredProducts.length,
    pageCount
  };
}

export async function getDashboardInventoryAlerts() {
  const result = await getInventoryAlertProducts({
    filter: "all",
    sort: "quantity_asc",
    page: 1,
    pageSize: 6
  });
  const alertProducts = result.products.filter((product) =>
    product.stockStatus === "low_stock" || product.stockStatus === "out_of_stock"
  );

  return {
    ...result,
    products: alertProducts.slice(0, 6)
  };
}

function getSummary(products: InventoryAlertProduct[]): InventoryAlertSummary {
  return {
    lowStock: products.filter((product) => product.stockStatus === "low_stock").length,
    outOfStock: products.filter((product) => product.stockStatus === "out_of_stock").length,
    notTracked: products.filter((product) => product.stockStatus === "not_tracked").length,
    trackedTotal: products.filter((product) => product.stockStatus !== "not_tracked").length
  };
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, (character) => `\\${character}`);
}
