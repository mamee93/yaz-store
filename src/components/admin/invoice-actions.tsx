"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Download, Eye, Printer, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui";

type InvoiceActionsProps = {
  invoiceId: string;
  showView?: boolean;
};

export function InvoiceActions({ invoiceId, showView = true }: InvoiceActionsProps) {
  const [pending, startTransition] = useTransition();

  function downloadPdf() {
    startTransition(async () => {
      window.location.href = `/admin/invoices/${invoiceId}/pdf`;
    });
  }

  function openPrint(path: string) {
    window.open(path, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showView ? (
        <Link
          href={`/admin/invoices/${invoiceId}`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-oud-brown/20 bg-oud-pearl px-3 text-xs font-semibold text-oud-brown transition hover:bg-oud-beige/45"
        >
          <Eye className="size-4" aria-hidden="true" />
          عرض الفاتورة
        </Link>
      ) : null}
      <Button
        type="button"
        variant="gold"
        size="sm"
        onClick={downloadPdf}
        disabled={pending}
        leftIcon={<Download className="size-4" />}
      >
        تحميل PDF A4
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => openPrint(`/admin/invoices/${invoiceId}/print`)}
        leftIcon={<Printer className="size-4" />}
      >
        طباعة A4
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => openPrint(`/admin/invoices/${invoiceId}/thermal?width=80`)}
        leftIcon={<ReceiptText className="size-4" />}
      >
        حرارية 80mm
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => openPrint(`/admin/invoices/${invoiceId}/thermal?width=58`)}
        leftIcon={<ReceiptText className="size-4" />}
      >
        حرارية 58mm
      </Button>
    </div>
  );
}
