"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Card, Price } from "@/components/ui";
import { AddToCartButton } from "./add-to-cart-button";
import type { StoreProduct } from "./static-catalog";

type ProductCardProps = {
  product: StoreProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const productHref = `/products/${product.slug}`;

  return (
    <Card
      className="group h-full cursor-pointer overflow-hidden bg-white transition duration-300 hover:-translate-y-1 hover:border-oud-gold/45 hover:shadow-gold"
      onClick={() => router.push(productHref)}
    >
      <Link href={productHref} className="block">
        <div
          className="relative aspect-[3/4] overflow-hidden border-b border-oud-brown/10"
          style={{ background: product.imageTone }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-x-8 bottom-8 h-44 rounded-t-full border border-white/35 bg-white/15 shadow-soft backdrop-blur-sm" />
          )}
          {product.badge ? (
            <Badge variant="gold" className="absolute right-3 top-3">
              {product.badge}
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <Link href={productHref} className="block space-y-2">
          <p className="text-xs font-bold text-oud-gold">{product.categoryName}</p>
          <h3 className="line-clamp-2 min-h-12 break-words text-sm font-bold leading-6 text-oud-brown sm:text-base">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-xs leading-6 text-oud-muted">
          {product.shortDescription}
        </p>
        <Badge variant={product.canAddToCart === false ? "danger" : "soft"}>
          {product.stockLabel}
        </Badge>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <Price value={product.price} className="text-base" />
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
