"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/validations/checkout-schema";
import type { Database, Json } from "@/types/database";

type ProductCheckoutRow = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  sku: string | null;
  price_omr: number;
  stock_quantity: number;
  track_stock: boolean;
  product_images: {
    public_url: string | null;
    sort_order: number;
    is_primary: boolean;
  }[] | null;
};

type CheckoutInsertIds = {
  id: string;
};

const deliveryFee = 2;

export async function createCheckoutOrderAction(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    country: formData.get("country"),
    governorate: formData.get("governorate"),
    wilayat: formData.get("wilayat"),
    area: formData.get("area"),
    addressLine: formData.get("addressLine"),
    deliveryNotes: formData.get("deliveryNotes"),
    paymentMethod: formData.get("paymentMethod"),
    productId: formData.getAll("productId"),
    quantity: formData.getAll("quantity")
  });

  if (!parsed.success) {
    redirectWithCheckoutError(
      parsed.error.issues[0]?.message ?? "تعذر إنشاء الطلب. تحقق من البيانات."
    );
  }

  const checkout = parsed.data;
  const requestedItems = checkout.productId.map((productId, index) => ({
    productId,
    quantity: checkout.quantity[index] ?? 1
  }));

  if (requestedItems.length !== checkout.quantity.length) {
    redirectWithCheckoutError("بيانات السلة غير صحيحة.");
  }

  const supabase = createAdminClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id,slug,name_ar,name_en,sku,price_omr,stock_quantity,track_stock,product_images(public_url,sort_order,is_primary)"
    )
    .in(
      "id",
      requestedItems.map((item) => item.productId)
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .returns<ProductCheckoutRow[]>();

  if (productsError || !products) {
    redirectWithCheckoutError("تعذر قراءة منتجات الطلب.");
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const orderLines = requestedItems.map((item) => {
    const product = productById.get(item.productId);

    if (!product) {
      redirectWithCheckoutError("أحد منتجات السلة غير متوفر حالياً.");
    }

    if (product.track_stock && product.stock_quantity < item.quantity) {
      redirectWithCheckoutError(`الكمية المطلوبة من ${product.name_ar} غير متوفرة.`);
    }

    const unitPrice = Number(product.price_omr);
    const lineTotal = roundMoney(unitPrice * item.quantity);

    return {
      product,
      quantity: item.quantity,
      unitPrice,
      lineTotal
    };
  });

  const subtotal = roundMoney(orderLines.reduce((total, item) => total + item.lineTotal, 0));
  const total = roundMoney(subtotal + deliveryFee);
  const orderNumber = generateOrderNumber();
  const addressSnapshot = {
    full_name: checkout.fullName,
    phone: checkout.phone,
    country: checkout.country,
    governorate: checkout.governorate,
    wilayat: checkout.wilayat,
    area: checkout.area,
    address_line_1: checkout.addressLine,
    delivery_notes: checkout.deliveryNotes
  } satisfies Json;

  let customerId: string | null = null;
  let addressId: string | null = null;
  let orderId: string | null = null;

  try {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        full_name: checkout.fullName,
        phone: checkout.phone,
        whatsapp_number: checkout.whatsapp,
        email: checkout.email
      } as Database["public"]["Tables"]["customers"]["Insert"] as never)
      .select("id")
      .single()
      .returns<CheckoutInsertIds>();

    if (customerError || !customer) {
      throw new Error("customer");
    }

    customerId = customer.id;

    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .insert({
        customer_id: customer.id,
        full_name: checkout.fullName,
        phone: checkout.phone,
        country: checkout.country,
        governorate: checkout.governorate,
        wilayat: checkout.wilayat,
        area: checkout.area,
        address_line_1: checkout.addressLine,
        delivery_notes: checkout.deliveryNotes,
        is_default: true
      } as Database["public"]["Tables"]["addresses"]["Insert"] as never)
      .select("id")
      .single()
      .returns<CheckoutInsertIds>();

    if (addressError || !address) {
      throw new Error("address");
    }

    addressId = address.id;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        address_id: address.id,
        status: "pending",
        payment_method: checkout.paymentMethod,
        payment_status: "pending",
        subtotal_omr: subtotal,
        delivery_fee_omr: deliveryFee,
        discount_omr: 0,
        total_omr: total,
        customer_name_snapshot: checkout.fullName,
        customer_phone_snapshot: checkout.phone,
        delivery_address_snapshot: addressSnapshot,
        customer_notes: checkout.deliveryNotes
      } as Database["public"]["Tables"]["orders"]["Insert"] as never)
      .select("id")
      .single()
      .returns<CheckoutInsertIds>();

    if (orderError || !order) {
      throw new Error("order");
    }

    orderId = order.id;

    const orderItems = orderLines.map((line) => ({
      order_id: order.id,
      product_id: line.product.id,
      product_name_ar_snapshot: line.product.name_ar,
      product_name_en_snapshot: line.product.name_en,
      sku_snapshot: line.product.sku,
      unit_price_omr: line.unitPrice,
      quantity: line.quantity,
      line_total_omr: line.lineTotal,
      product_image_url_snapshot: getPrimaryProductImageUrl(line.product.product_images)
    }));

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems as never);

    if (orderItemsError) {
      throw new Error("order_items");
    }

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      method: checkout.paymentMethod,
      status: "pending",
      amount_omr: total,
      provider: "manual"
    } as Database["public"]["Tables"]["payments"]["Insert"] as never);

    if (paymentError) {
      throw new Error("payment");
    }
  } catch {
    await cleanupFailedOrder({ customerId, addressId, orderId });
    redirectWithCheckoutError("تعذر إنشاء الطلب. حاول مرة أخرى.");
  }

  redirect(`/order-confirmation/${orderNumber}?clearCart=1`);
}

async function cleanupFailedOrder({
  customerId,
  addressId,
  orderId
}: {
  customerId: string | null;
  addressId: string | null;
  orderId: string | null;
}) {
  const supabase = createAdminClient();

  if (orderId) {
    await supabase.from("orders").delete().eq("id", orderId);
  }

  if (addressId) {
    await supabase.from("addresses").delete().eq("id", addressId);
  }

  if (customerId) {
    await supabase.from("customers").delete().eq("id", customerId);
  }
}

function getPrimaryProductImageUrl(images: ProductCheckoutRow["product_images"]) {
  if (!images?.length) {
    return null;
  }

  return (
    [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) {
        return -1;
      }

      if (!a.is_primary && b.is_primary) {
        return 1;
      }

      return a.sort_order - b.sort_order;
    })[0]?.public_url ?? null
  );
}

function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `OY-${year}${month}${day}-${random}`;
}

function roundMoney(value: number) {
  return Number(value.toFixed(3));
}

function redirectWithCheckoutError(message: string): never {
  const params = new URLSearchParams({ status: "error", message });
  redirect(`/checkout?${params.toString()}`);
}
