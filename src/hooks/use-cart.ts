"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/stores/cart-store";

export function useCart() {
  const [isHydrated, setIsHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  return {
    items: isHydrated ? items : [],
    itemCount: isHydrated ? itemCount : 0,
    subtotal: isHydrated ? subtotal : 0,
    isHydrated,
    addItem,
    removeItem,
    setQuantity,
    clearCart
  };
}
