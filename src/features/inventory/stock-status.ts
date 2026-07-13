export type ProductStockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "not_tracked";

export type ProductStockInput = {
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  track_stock: boolean | null;
};

export function getProductStockStatus(product: ProductStockInput): ProductStockStatus {
  if (!product.track_stock) {
    return "not_tracked";
  }

  const stockQuantity = Math.max(0, product.stock_quantity ?? 0);
  const lowStockThreshold = Math.max(0, product.low_stock_threshold ?? 0);

  if (stockQuantity <= 0) {
    return "out_of_stock";
  }

  if (stockQuantity <= lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
}

export function isStockAlertStatus(status: ProductStockStatus) {
  return status === "low_stock" || status === "out_of_stock";
}

export function getStockStatusLabel(status: ProductStockStatus) {
  if (status === "out_of_stock") {
    return "\u0646\u0641\u062f \u0627\u0644\u0645\u062e\u0632\u0648\u0646";
  }

  if (status === "low_stock") {
    return "\u0645\u062e\u0632\u0648\u0646 \u0645\u0646\u062e\u0641\u0636";
  }

  if (status === "not_tracked") {
    return "\u063a\u064a\u0631 \u0645\u062a\u062a\u0628\u0639";
  }

  return "\u0645\u062a\u0648\u0641\u0631";
}

export function getStorefrontStockLabel(product: ProductStockInput) {
  const status = getProductStockStatus(product);

  if (status === "low_stock") {
    return `\u0645\u062a\u0628\u0642\u064a ${Math.max(0, product.stock_quantity ?? 0)} \u0641\u0642\u0637`;
  }

  return getStockStatusLabel(status);
}
