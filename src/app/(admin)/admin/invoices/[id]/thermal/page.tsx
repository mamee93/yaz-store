import { notFound } from "next/navigation";
import { InvoicePrintControls } from "@/components/admin/invoice-print-controls";
import { ThermalInvoiceDocument } from "@/components/admin/thermal-invoice-document";
import { getAdminInvoiceById } from "@/features/invoices/queries";

type ThermalInvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    width?: string;
  }>;
};

export default async function ThermalInvoicePage({ params, searchParams }: ThermalInvoicePageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const width = resolvedSearchParams.width === "58" ? 58 : 80;
  const invoice = await getAdminInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white p-3 text-black print:p-0">
      <style>
        {`
          @page {
            size: ${width}mm auto;
            margin: 0;
          }

          @media print {
            html,
            body {
              width: ${width}mm;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
            }

            aside,
            nav,
            header,
            .admin-sidebar,
            .admin-header,
            .print\\:hidden {
              display: none !important;
            }

            .thermal-receipt {
              margin: 0 auto !important;
              box-shadow: none !important;
              border: 0 !important;
              color: #000 !important;
              background: #fff !important;
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>
      <InvoicePrintControls invoiceId={invoice.id} mode={width === 58 ? "thermal-58" : "thermal-80"} />
      <ThermalInvoiceDocument invoice={invoice} width={width} />
    </main>
  );
}
