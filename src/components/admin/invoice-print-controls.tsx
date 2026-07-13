"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowRight, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import {
  logInvoicePrintA4Action,
  logInvoicePrintThermal58Action,
  logInvoicePrintThermal80Action
} from "@/features/invoices/actions";

type PrintMode = "a4" | "thermal-80" | "thermal-58";

type InvoicePrintControlsProps = {
  invoiceId: string;
  mode: PrintMode;
};

const buttonLabels: Record<PrintMode, string> = {
  a4: "طباعة A4",
  "thermal-80": "طباعة حرارية 80mm",
  "thermal-58": "طباعة حرارية 58mm"
};

export function InvoicePrintControls({ invoiceId, mode }: InvoicePrintControlsProps) {
  const [pending, startTransition] = useTransition();

  function print() {
    startTransition(async () => {
      try {
        if (mode === "a4") {
          await logInvoicePrintA4Action(invoiceId);
        } else if (mode === "thermal-80") {
          await logInvoicePrintThermal80Action(invoiceId);
        } else {
          await logInvoicePrintThermal58Action(invoiceId);
        }
      } catch (error) {
        console.error("Failed to log invoice print action", error);
      } finally {
        window.print();
      }
    });
  }

  return (
    <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3 rounded-oud border border-oud-brown/10 bg-oud-pearl p-3">
      <Link
        href={`/admin/invoices/${invoiceId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-oud-brown"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
        العودة إلى الفاتورة
      </Link>
      <Button
        type="button"
        onClick={print}
        disabled={pending}
        isLoading={pending}
        size="sm"
        leftIcon={<Printer className="size-4" />}
      >
        {buttonLabels[mode]}
      </Button>
    </div>
  );
}
