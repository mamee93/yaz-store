"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import type { StoreProduct } from "./static-catalog";

type AddToCartButtonProps = {
  product: StoreProduct;
  quantity?: number;
  compact?: boolean;
  className?: string;
};

export function AddToCartButton({
  product,
  quantity = 1,
  compact = false,
  className
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");
  const canAdd = Boolean(product.id) && product.canAddToCart !== false;

  function handleAddToCart() {
    if (!product.id) {
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.categoryName,
      price: product.price,
      imageTone: product.imageTone,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
      sizeLabel: product.sizeLabel,
      quantity
    });
    setMessage("تمت الإضافة");
    window.setTimeout(() => setMessage(""), 1800);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd}
        className="inline-flex size-9 items-center justify-center rounded-oud bg-oud-brown text-oud-ivory transition hover:bg-oud-gold hover:text-oud-brown disabled:cursor-not-allowed disabled:bg-oud-brown/40"
        aria-label={canAdd ? `إضافة ${product.name} إلى السلة` : "الإضافة غير متاحة"}
        title={message || undefined}
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd}
        className="w-full"
        leftIcon={<ShoppingBag className="size-4" />}
      >
        {canAdd ? "إضافة للسلة" : "غير متاح للإضافة"}
      </Button>
      {message ? <p className="mt-2 text-xs font-semibold text-green-900">{message}</p> : null}
    </div>
  );
}
