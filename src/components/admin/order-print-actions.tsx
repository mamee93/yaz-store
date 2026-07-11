"use client";

import { useTransition } from "react";
import { FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui";
import { logOrderPrintAction } from "@/features/orders/actions";

type OrderPrintActionsProps = {
  orderId: string;
};

export function OrderPrintActions({ orderId }: OrderPrintActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handlePrint(type: "invoice" | "shipping_label") {
    startTransition(async () => {
      document.body.dataset.orderPrintMode = type;
      await logOrderPrintAction(orderId, type);
      const cleanup = () => {
        delete document.body.dataset.orderPrintMode;
      };
      window.addEventListener("afterprint", cleanup, { once: true });
      window.print();
      window.setTimeout(cleanup, 10_000);
    });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Button
        type="button"
        variant="secondary"
        onClick={() => handlePrint("invoice")}
        disabled={isPending}
        leftIcon={<FileText className="size-4" />}
      >
        طباعة الفاتورة
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={() => handlePrint("shipping_label")}
        disabled={isPending}
        leftIcon={<Truck className="size-4" />}
      >
        طباعة بوليصة الشحن
      </Button>
    </div>
  );
}
