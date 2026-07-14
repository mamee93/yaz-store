"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { Check, ShoppingBag } from "lucide-react";
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
  const [isAdded, setIsAdded] = useState(false);
  const canAdd = Boolean(product.id) && product.canAddToCart !== false;

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

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
    setMessage("تمت إضافة المنتج إلى السلة");
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1000);
    window.setTimeout(() => setMessage(""), 1800);
  }

  const icon = isAdded ? (
    <Check className="size-4" aria-hidden="true" />
  ) : (
    <ShoppingBag className="size-4" aria-hidden="true" />
  );

  if (compact) {
    return (
      <span className="relative inline-flex">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="inline-flex size-9 items-center justify-center rounded-oud bg-oud-brown text-oud-ivory transition hover:bg-oud-gold hover:text-oud-brown disabled:cursor-not-allowed disabled:bg-oud-brown/40"
          aria-label={canAdd ? `إضافة ${product.name} إلى السلة` : "الإضافة غير متاحة"}
          title={message || undefined}
        >
          {icon}
        </button>
        {message ? <ToastMessage>{message}</ToastMessage> : null}
      </span>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAdd}
        className="w-full"
        leftIcon={icon}
      >
        {canAdd ? "إضافة للسلة" : "غير متاح للإضافة"}
      </Button>
      {message ? <ToastMessage>{message}</ToastMessage> : null}
    </div>
  );
}

function ToastMessage({ children }: { children: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-oud bg-oud-brown px-4 py-2 text-xs font-semibold text-oud-ivory shadow-soft"
    >
      {children}
    </span>
  );
}
