import Image from "next/image";
import Link from "next/link";
import { Badge, Card, Price } from "@/components/ui";
import { AddToCartButton } from "./add-to-cart-button";
import type { StoreProduct } from "./static-catalog";

type ProductCardProps = {
  product: StoreProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group h-full overflow-hidden transition hover:-translate-y-1 hover:border-oud-gold/35 hover:shadow-gold">
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className="relative aspect-[4/5] border-b border-oud-brown/10"
          style={{ background: product.imageTone }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover"
            />
          ) : null}
          {product.badge ? (
            <Badge variant="gold" className="absolute right-3 top-3">
              {product.badge}
            </Badge>
          ) : null}
          {!product.imageUrl ? (
            <>
              <div className="absolute bottom-5 left-1/2 h-32 w-16 -translate-x-1/2 rounded-t-full border border-white/35 bg-white/18 shadow-soft backdrop-blur-sm" />
              <div className="absolute bottom-5 left-1/2 h-10 w-24 -translate-x-1/2 rounded-full bg-oud-brown/18 blur-md" />
            </>
          ) : null}
        </div>
      </Link>

      <div className="space-y-3 p-3 md:p-4">
        <Link href={`/products/${product.slug}`} className="block space-y-1">
          <p className="text-xs font-semibold text-oud-gold">{product.categoryName}</p>
          <h3 className="line-clamp-2 min-h-12 text-sm font-bold leading-6 text-oud-brown">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-xs leading-6 text-oud-muted">
          {product.shortDescription}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <Price value={product.price} className="text-sm" />
            {product.compareAtPrice ? (
              <Price value={product.compareAtPrice} className="text-xs text-oud-muted line-through" />
            ) : null}
          </div>
          <AddToCartButton product={product} compact />
        </div>
      </div>
    </Card>
  );
}
