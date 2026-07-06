import { escapeHtml, formatMoney } from "@/features/email/templates/order-confirmation-email";

export type AdminNewOrderEmailInput = {
  storeName: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  total: number;
  shippingArea: string | null;
  adminOrderUrl: string | null;
};

export function renderAdminNewOrderEmail(input: AdminNewOrderEmailInput) {
  return `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <body style="margin:0;background:#f6f0e7;font-family:Tahoma,Arial,sans-serif;color:#3b2618;">
        <div style="max-width:680px;margin:0 auto;padding:24px;">
          <div style="background:#fffaf2;border:1px solid #eadfce;border-radius:16px;padding:24px;">
            <p style="margin:0 0 8px;color:#a87b2f;font-weight:700;">${escapeHtml(input.storeName)}</p>
            <h1 style="margin:0;font-size:26px;line-height:1.4;color:#3b2618;">طلب جديد في المتجر</h1>
            <p style="margin:14px 0 0;color:#5f4d3d;line-height:1.9;">
              تم إنشاء طلب جديد ويحتاج إلى مراجعة فريق الإدارة.
            </p>

            <div style="background:#fbf8f1;border:1px solid #eadfce;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="margin:0;color:#7b6a58;">رقم الطلب</p>
              <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#3b2618;direction:ltr;text-align:right;">${escapeHtml(input.orderNumber)}</p>
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              ${renderRow("العميل", input.customerName)}
              ${renderRow("الهاتف", input.customerPhone)}
              ${renderRow("البريد الإلكتروني", input.customerEmail ?? "غير متوفر")}
              ${renderRow("منطقة التوصيل", input.shippingArea ?? "غير محددة")}
              ${renderRow("الإجمالي", formatMoney(input.total))}
            </table>

            ${
              input.adminOrderUrl
                ? `<a href="${escapeHtml(input.adminOrderUrl)}" style="display:inline-block;margin-top:22px;background:#3b2618;color:#fffaf2;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700;">فتح الطلب في لوحة الإدارة</a>`
                : ""
            }
          </div>
        </div>
      </body>
    </html>
  `;
}

function renderRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eadfce;color:#7b6a58;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eadfce;color:#3b2618;font-weight:700;text-align:left;">${escapeHtml(value)}</td>
    </tr>
  `;
}
