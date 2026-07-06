"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";

export function ClearCartOnConfirmation() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  useEffect(() => {
    if (searchParams.get("clearCart") === "1") {
      clearCart();
    }
  }, [clearCart, searchParams]);

  return null;
}
