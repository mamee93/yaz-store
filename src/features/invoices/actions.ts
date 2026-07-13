"use server";

import { revalidatePath } from "next/cache";
import { logAdminActivity } from "@/features/admin-audit/log";
import { requireAdminRole } from "@/features/auth/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProfile } from "@/features/auth/queries";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];

export async function ensureInvoiceForOrder(orderId: string, admin: AdminProfile) {
  const supabase = createAdminClient();
  const existing = await getInvoiceByOrderId(orderId);

  if (existing) {
    return existing;
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,order_number,invoice_number")
    .eq("id", orderId)
    .maybeSingle()
    .returns<{ id: string; order_number: string; invoice_number: string | null } | null>();

  if (orderError || !order) {
    console.error("Failed to read order before invoice create", orderError);
    throw new Error("invoice_order_not_found");
  }

  const invoiceNumber = order.invoice_number ?? (await generateInvoiceNumber());
  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      order_id: order.id,
      invoice_number: invoiceNumber,
      created_by_admin_id: admin.id
    } as Database["public"]["Tables"]["invoices"]["Insert"] as never)
    .select("id,order_id,invoice_number,issued_at,created_by_admin_id,created_at,updated_at")
    .single()
    .returns<InvoiceRow>();

  if (insertError || !invoice) {
    const fallback = await getInvoiceByOrderId(orderId);

    if (fallback) {
      return fallback;
    }

    console.error("Failed to create invoice", insertError);
    throw new Error("invoice_create_failed");
  }

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ invoice_number: invoice.invoice_number } as Database["public"]["Tables"]["orders"]["Update"])
    .eq("id", orderId);

  if (updateOrderError) {
    console.error("Failed to save invoice number on order", updateOrderError);
    throw new Error("invoice_order_update_failed");
  }

  await logAdminActivity({
    admin,
    action: "invoice.create",
    entityType: "invoice",
    entityId: invoice.id,
    description: `تم إنشاء الفاتورة ${invoice.invoice_number}`,
    metadata: {
      order_id: orderId,
      order_number: order.order_number,
      invoice_number: invoice.invoice_number
    }
  });

  revalidateInvoicePaths(invoice.id, orderId);
  return invoice;
}

export async function logInvoicePrintAction(invoiceId: string) {
  await logInvoicePrintA4Action(invoiceId);
}

export async function logInvoicePrintA4Action(invoiceId: string) {
  await logInvoiceAction(invoiceId, "invoice.print_a4", "تمت طباعة فاتورة A4");
}

export async function logInvoicePrintThermal80Action(invoiceId: string) {
  await logInvoiceAction(invoiceId, "invoice.print_thermal_80", "تمت طباعة إيصال حراري 80 ملم");
}

export async function logInvoicePrintThermal58Action(invoiceId: string) {
  await logInvoiceAction(invoiceId, "invoice.print_thermal_58", "تمت طباعة إيصال حراري 58 ملم");
}

export async function logInvoiceDownloadAction(invoiceId: string) {
  await logInvoiceAction(invoiceId, "invoice.download", "تم تحميل PDF الفاتورة");
}

export async function logInvoiceDownloadFromRoute(invoiceId: string) {
  await logInvoiceAction(invoiceId, "invoice.download", "تم تحميل PDF الفاتورة");
}

async function logInvoiceAction(
  invoiceId: string,
  action: "invoice.print_a4" | "invoice.print_thermal_80" | "invoice.print_thermal_58" | "invoice.download",
  description: string
) {
  const admin = await requireAdminRole(["owner", "manager", "cashier"]);

  if (!admin) {
    return;
  }

  const supabase = createAdminClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id,order_id,invoice_number")
    .eq("id", invoiceId)
    .maybeSingle()
    .returns<Pick<InvoiceRow, "id" | "order_id" | "invoice_number"> | null>();

  if (error || !invoice) {
    console.error("Failed to read invoice before audit", error);
    return;
  }

  await logAdminActivity({
    admin,
    action,
    entityType: "invoice",
    entityId: invoice.id,
    description,
    metadata: {
      order_id: invoice.order_id,
      invoice_number: invoice.invoice_number
    }
  });
}

async function getInvoiceByOrderId(orderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id,order_id,invoice_number,issued_at,created_by_admin_id,created_at,updated_at")
    .eq("order_id", orderId)
    .maybeSingle()
    .returns<InvoiceRow | null>();

  if (error) {
    console.error("Failed to read invoice by order", error);
    return null;
  }

  return data;
}

async function generateInvoiceNumber() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("generate_invoice_number");

  if (error || !data) {
    console.error("Failed to generate invoice number", error);
    throw new Error("invoice_number_failed");
  }

  return data;
}

function revalidateInvoicePaths(invoiceId: string, orderId: string) {
  revalidatePath(`/admin/invoices/${invoiceId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/activity");
}
