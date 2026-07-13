import { notFound } from "next/navigation";
import { InvoiceDocument } from "@/components/admin/invoice-document";
import { InvoicePrintControls } from "@/components/admin/invoice-print-controls";
import { getAdminInvoiceById } from "@/features/invoices/queries";

type A4InvoicePrintPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function A4InvoicePrintPage({ params }: A4InvoicePrintPageProps) {
  const { id } = await params;
  const invoice = await getAdminInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white p-4 text-oud-ink print:p-0">
      <style>
        {`
          @page {
            size: A4;
            margin: 10mm;
          }

          @media print {
            html,
            body {
              background: #fff !important;
              direction: rtl;
            }

            aside,
            nav,
            header,
            .admin-sidebar,
            .admin-header,
            .invoice-actions,
            .print\\:hidden {
              display: none !important;
            }

            .invoice-paper {
              box-shadow: none !important;
              border: 0 !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            table,
            tr,
            td,
            th {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      <InvoicePrintControls invoiceId={invoice.id} mode="a4" />
      <InvoiceDocument invoice={invoice} showActions={false} />
    </main>
  );
}
