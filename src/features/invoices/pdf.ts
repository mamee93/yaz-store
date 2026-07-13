import { createInvoiceQrMatrix, getCode128Bars } from "@/features/invoices/codes";
import type { AdminInvoice } from "@/features/invoices/queries";
import { getOrderTrackingUrl } from "@/features/order-tracking/url";

export function generateInvoicePdf(invoice: AdminInvoice) {
  const content = buildContent(invoice);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}\nendstream`
  ];
  const parts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(parts.join(""), "binary"));
    parts.push(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`);
  }

  const xrefOffset = Buffer.byteLength(parts.join(""), "binary");
  parts.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);

  for (let index = 1; index < offsets.length; index += 1) {
    parts.push(`${offsets[index].toString().padStart(10, "0")} 00000 n \n`);
  }

  parts.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return Buffer.from(parts.join(""), "binary");
}

function buildContent(invoice: AdminInvoice) {
  const lines: string[] = [];
  const order = invoice.order;
  const qrMatrix = createInvoiceQrMatrix(getOrderTrackingUrl(order.order_number));
  const barcode = getCode128Bars(invoice.invoice_number);

  lines.push("q 1 1 1 rg 0 0 595 842 re f Q");
  lines.push("q 0.42 0.34 0.29 rg 0 772 595 70 re f Q");
  lines.push(text(42, 802, 22, "OUD YAZ", true, "1 1 1 rg"));
  lines.push(text(42, 782, 10, "Professional Invoice", false, "0.92 0.80 0.72 rg"));
  lines.push(text(395, 804, 16, invoice.invoice_number, true, "1 1 1 rg"));
  lines.push(text(395, 784, 9, `Issued: ${formatDate(invoice.issued_at)}`, false, "1 1 1 rg"));

  lines.push(text(42, 728, 18, "Invoice Details", true));
  lines.push(text(42, 704, 10, `Order: ${order.order_number}`));
  lines.push(text(42, 688, 10, `Customer: ${toPdfText(order.customer_name_snapshot)}`));
  lines.push(text(42, 672, 10, `Phone: ${toPdfText(order.customer_phone_snapshot)}`));
  lines.push(text(42, 656, 10, `Invoice date: ${formatDate(invoice.issued_at)}`));

  lines.push(drawBarcode(330, 652, 190, 44, barcode));
  lines.push(text(330, 638, 8, invoice.invoice_number));
  lines.push(drawQr(438, 536, 84, qrMatrix));

  lines.push("q 0.96 0.93 0.90 rg 42 500 511 28 re f Q");
  lines.push(text(52, 510, 9, "Product", true));
  lines.push(text(330, 510, 9, "Qty", true));
  lines.push(text(390, 510, 9, "Price", true));
  lines.push(text(475, 510, 9, "Total", true));

  let y = 476;
  for (const item of order.order_items.slice(0, 12)) {
    lines.push(text(52, y, 9, toPdfText(item.product_name_ar_snapshot)));
    lines.push(text(335, y, 9, item.quantity.toString()));
    lines.push(text(390, y, 9, formatMoney(item.unit_price_omr)));
    lines.push(text(475, y, 9, formatMoney(item.line_total_omr)));
    lines.push("q 0.86 0.82 0.78 RG 42 " + (y - 10).toFixed(2) + " 511 0.5 re f Q");
    y -= 24;
  }

  const summaryX = 375;
  lines.push(text(summaryX, 170, 10, `Subtotal: ${formatMoney(order.subtotal_omr)}`));
  lines.push(text(summaryX, 152, 10, `Delivery: ${formatMoney(order.delivery_fee_omr)}`));
  lines.push(text(summaryX, 134, 10, `Discount: ${formatMoney(order.discount_omr)}`));
  lines.push(text(summaryX, 116, 10, `Tax: ${formatMoney(order.tax_omr)}`));
  lines.push(text(summaryX, 92, 14, `Grand total: ${formatMoney(order.total_omr)}`, true));
  lines.push(text(42, 92, 9, "Thank you for choosing Oud Yaz."));

  return lines.join("\n");
}

function text(x: number, y: number, size: number, value: string, bold = false, color = "0.13 0.09 0.06 rg") {
  return `BT ${color} /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`;
}

function drawQr(x: number, y: number, size: number, matrix: boolean[][]) {
  const moduleSize = size / matrix.length;
  const rects: string[] = [`q 1 1 1 rg ${x} ${y} ${size} ${size} re f 0 0 0 rg`];

  matrix.forEach((row, rowIndex) => {
    row.forEach((dark, colIndex) => {
      if (dark) {
        rects.push(
          `${(x + colIndex * moduleSize).toFixed(2)} ${(y + size - (rowIndex + 1) * moduleSize).toFixed(2)} ${moduleSize.toFixed(2)} ${moduleSize.toFixed(2)} re f`
        );
      }
    });
  });

  rects.push("Q");
  return rects.join("\n");
}

function drawBarcode(
  x: number,
  y: number,
  width: number,
  height: number,
  barcode: ReturnType<typeof getCode128Bars>
) {
  const scale = width / barcode.width;
  const rects = [`q 1 1 1 rg ${x} ${y} ${width} ${height} re f 0 0 0 rg`];

  for (const bar of barcode.bars) {
    rects.push(`${(x + bar.x * scale).toFixed(2)} ${y} ${(bar.width * scale).toFixed(2)} ${height} re f`);
  }

  rects.push("Q");
  return rects.join("\n");
}

function escapePdf(value: string) {
  return toPdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfText(value: string) {
  return value.replace(/[^\x20-\x7e]/g, "?").slice(0, 70);
}

function formatMoney(value: number) {
  return `${Number(value).toFixed(3)} OMR`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
