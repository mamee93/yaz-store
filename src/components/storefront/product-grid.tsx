import { ProductCard } from "./product-card";
import type { StoreProduct } from "./static-catalog";

type ProductGridProps = {
  products: StoreProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
