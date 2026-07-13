import { NextResponse } from "next/server";
import { logInvoiceDownloadFromRoute } from "@/features/invoices/actions";
import { generateInvoicePdf } from "@/features/invoices/pdf";
import { getAdminInvoiceById } from "@/features/invoices/queries";

export const runtime = "nodejs";

type InvoicePdfRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: InvoicePdfRouteProps) {
  const { id } = await params;
  const invoice = await getAdminInvoiceById(id);

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  await logInvoiceDownloadFromRoute(id);
  const pdf = generateInvoicePdf(invoice);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, no-store"
    }
  });
}
