import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { Badge, Card, EmptyState, Price } from "@/components/ui";
import {
  getProductStockStatus,
  getStockStatusLabel,
  type ProductStockStatus
} from "@/features/inventory/stock-status";
import { softDeleteProductAction } from "@/features/products/actions";
import type { ProductRow } from "@/features/products/queries";

type ProductTableProps = {
  products: ProductRow[];
};

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        title={"\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a"}
        description={"\u063a\u064a\u0651\u0631 \u0627\u0644\u0641\u0644\u0627\u062a\u0631 \u0623\u0648 \u0623\u0636\u0641 \u0645\u0646\u062a\u062c\u064b\u0627 \u062c\u062f\u064a\u062f\u064b\u0627."}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center justify-center rounded-oud bg-oud-brown px-4 text-sm font-semibold text-oud-ivory"
          >
            {"\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062a\u062c"}
          </Link>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden shadow-none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[62rem] text-right text-sm">
          <thead className="bg-oud-beige/35 text-xs text-oud-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">{"\u0627\u0644\u0645\u0646\u062a\u062c"}</th>
              <th className="px-5 py-3 font-semibold">{"\u0627\u0644\u062a\u0635\u0646\u064a\u0641"}</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 font-semibold">{"\u0627\u0644\u0633\u0639\u0631"}</th>
              <th className="px-5 py-3 font-semibold">{"\u0627\u0644\u0643\u0645\u064a\u0629 / \u0627\u0644\u062d\u062f"}</th>
              <th className="px-5 py-3 font-semibold">{"\u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646"}</th>
              <th className="px-5 py-3 font-semibold">{"\u0625\u062c\u0631\u0627\u0621"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oud-brown/10">
            {products.map((product) => {
              const deleteAction = softDeleteProductAction.bind(null, product.id);
              const stockStatus = getProductStockStatus(product);

              return (
                <tr key={product.id} className="bg-oud-pearl">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="size-12 rounded-oud bg-oud-beige"
                        aria-hidden="true"
                        style={{ background: getProductImageBackground(product) }}
                      />
                      <span>
                        <span className="block font-semibold text-oud-brown">{product.name_ar}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {product.is_featured ? <Badge variant="gold">{"\u0645\u0645\u064a\u0632"}</Badge> : null}
                          {product.is_best_seller ? <Badge variant="soft">{"\u0627\u0644\u0623\u0643\u062b\u0631 \u0637\u0644\u0628\u064b\u0627"}</Badge> : null}
                          {product.is_new_arrival ? <Badge variant="soft">{"\u062c\u062f\u064a\u062f"}</Badge> : null}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-oud-muted">
                    {product.categories?.name_ar ?? "\u0628\u062f\u0648\u0646 \u062a\u0635\u0646\u064a\u0641"}
                  </td>
                  <td className="px-5 py-4 text-oud-muted" dir="ltr">
                    {product.sku ?? "-"}
                  </td>
                  <td className="px-5 py-4">
                    <Price value={product.price_omr} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <span className="block font-semibold text-oud-brown">{product.stock_quantity}</span>
                      <span className="block text-xs text-oud-muted">
                        {"\u062d\u062f \u0627\u0644\u062a\u0646\u0628\u064a\u0647"}: {product.low_stock_threshold}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={getStockStatusBadgeVariant(stockStatus)}>
                        {getStockStatusLabel(stockStatus)}
                      </Badge>
                      <Badge variant={product.is_active ? "success" : "soft"}>
                        {product.is_active ? "\u0646\u0634\u0637" : "\u0645\u0633\u0648\u062f\u0629"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-oud-brown"
                      >
                        <Edit className="size-4" aria-hidden="true" />
                        {"\u062a\u0639\u062f\u064a\u0644"}
                      </Link>
                      <ConfirmActionButton
                        action={deleteAction}
                        triggerLabel={"\u062d\u0630\u0641"}
                        confirmLabel={"\u062a\u0639\u0637\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c"}
                        title={"\u062d\u0630\u0641 \u0627\u0644\u0645\u0646\u062a\u062c"}
                        description={"\u0633\u064a\u062a\u0645 \u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0645\u0646\u062a\u062c \u0645\u0646 \u0627\u0644\u0645\u062a\u062c\u0631 \u0648\u062a\u0639\u0637\u064a\u0644\u0647."}
                        itemName={product.name_ar}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="size-4" />}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function getStockStatusBadgeVariant(status: ProductStockStatus) {
  if (status === "out_of_stock") {
    return "danger";
  }

  if (status === "low_stock") {
    return "gold";
  }

  if (status === "not_tracked") {
    return "soft";
  }

  return "success";
}

function getProductImageBackground(product: ProductRow) {
  const primaryImage = product.product_images?.find((image) => image.is_primary);
  const fallbackImage = product.product_images?.[0];
  const imageUrl =
    primaryImage?.image_url ??
    primaryImage?.public_url ??
    fallbackImage?.image_url ??
    fallbackImage?.public_url;

  return imageUrl ? `url("${imageUrl}") center/cover` : undefined;
}