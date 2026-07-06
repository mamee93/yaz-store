export type OrderEmailItem = {
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderConfirmationEmailInput = {
  storeName: string;
  orderNumber: string;
  customerName: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingArea: string | null;
  orderStatus: string;
};

export function renderOrderConfirmationEmail(input: OrderConfirmationEmailInput) {
  const rows = input.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #eadfce;">
            <strong>${escapeHtml(item.name)}</strong>
            ${item.sku ? `<br><span style="color:#7b6a58;">${escapeHtml(item.sku)}</span>` : ""}
          </td>
          <td style="padding:12px;border-bottom:1px solid #eadfce;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #eadfce;text-align:left;">${formatMoney(item.lineTotal)}</td>
        </tr>
      `
    )
    .join("");

  return renderEmailShell({
    storeName: input.storeName,
    title: "تم استلام طلبك",
    intro: `شكرا لك ${escapeHtml(input.customerName)}. تم استلام طلبك وسنقوم بمراجعته والتواصل معك عند الحاجة.`,
    body: `
      <div style="background:#fbf8f1;border:1px solid #eadfce;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#7b6a58;">رقم الطلب</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#3b2618;direction:ltr;text-align:right;">${escapeHtml(input.orderNumber)}</p>
      </div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background:#f3eadc;color:#3b2618;">
            <th style="padding:12px;text-align:right;">المنتج</th>
            <th style="padding:12px;text-align:center;">الكمية</th>
            <th style="padding:12px;text-align:left;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${renderTotals(input)}

      <div style="margin-top:20px;color:#5f4d3d;line-height:1.9;">
        <p style="margin:0;"><strong>منطقة التوصيل:</strong> ${escapeHtml(input.shippingArea ?? "غير محددة")}</p>
        <p style="margin:0;"><strong>حالة الطلب:</strong> ${escapeHtml(input.orderStatus)}</p>
      </div>
    `
  });
}

function renderTotals(input: OrderConfirmationEmailInput) {
  return `
    <div style="margin-top:18px;border-top:1px solid #eadfce;padding-top:14px;">
      ${renderTotalLine("المجموع الفرعي", input.subtotal)}
      ${renderTotalLine("الخصم", -input.discount)}
      ${renderTotalLine("التوصيل", input.shipping)}
      ${renderTotalLine("الضريبة", input.tax)}
      <div style="display:flex;justify-content:space-between;gap:16px;margin-top:10px;font-size:18px;font-weight:700;color:#3b2618;">
        <span>الإجمالي</span>
        <span dir="ltr">${formatMoney(input.total)}</span>
      </div>
    </div>
  `;
}

function renderTotalLine(label: string, value: number) {
  return `
    <div style="display:flex;justify-content:space-between;gap:16px;margin:6px 0;color:#5f4d3d;">
      <span>${label}</span>
      <span dir="ltr">${formatMoney(value)}</span>
    </div>
  `;
}

function renderEmailShell({
  storeName,
  title,
  intro,
  body
}: {
  storeName: string;
  title: string;
  intro: string;
  body: string;
}) {
  return `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <body style="margin:0;background:#f6f0e7;font-family:Tahoma,Arial,sans-serif;color:#3b2618;">
        <div style="max-width:680px;margin:0 auto;padding:24px;">
          <div style="background:#fffaf2;border:1px solid #eadfce;border-radius:16px;padding:24px;">
            <p style="margin:0 0 8px;color:#a87b2f;font-weight:700;">${escapeHtml(storeName)}</p>
            <h1 style="margin:0;font-size:28px;line-height:1.4;color:#3b2618;">${title}</h1>
            <p style="margin:14px 0 0;color:#5f4d3d;line-height:1.9;">${intro}</p>
            ${body}
          </div>
        </div>
      </body>
    </html>
  `;
}

export function formatMoney(value: number) {
  return `${value.toFixed(3)} ر.ع`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
