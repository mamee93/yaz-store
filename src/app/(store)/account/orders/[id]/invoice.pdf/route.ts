import { NextResponse } from "next/server";
import { generateInvoicePdf } from "@/features/invoices/pdf";
import { getCustomerInvoiceForOrder } from "@/features/order-tracking/queries";

export const runtime = "nodejs";

type CustomerInvoicePdfRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: CustomerInvoicePdfRouteProps) {
  const { id } = await params;
  const invoice = await getCustomerInvoiceForOrder(id);

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const pdf = generateInvoicePdf(invoice);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, no-store"
    }
  });
}
