import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InvoiceDocument } from "@/components/admin/invoice-document";
import { getAdminInvoiceById } from "@/features/invoices/queries";

type AdminInvoicePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminInvoicePage({ params }: AdminInvoicePageProps) {
  const { id } = await params;
  const invoice = await getAdminInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="الفواتير"
        title={`فاتورة ${invoice.invoice_number}`}
        description={`فاتورة الطلب ${invoice.order.order_number} مع QR Code وBarcode.`}
      />
      <InvoiceDocument invoice={invoice} />
    </div>
  );
}
