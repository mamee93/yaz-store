"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  incrementCouponUsage,
  validateCouponForSubtotal
} from "@/features/coupons/actions";
import { sendEmail } from "@/features/email/send-email";
import { renderAdminNewOrderEmail } from "@/features/email/templates/admin-new-order-email";
import {
  renderOrderConfirmationEmail,
  type OrderEmailItem
} from "@/features/email/templates/order-confirmation-email";
import { createOrderNotification } from "@/features/notifications/actions";
import { calculateShippingForCheckout } from "@/features/shipping/actions";
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

type CheckoutStoreSettings = Pick<
  Database["public"]["Tables"]["store_settings"]["Row"],
  | "is_store_open"
  | "maintenance_message"
  | "maintenance_message_ar"
  | "minimum_order_amount"
  | "is_tax_enabled"
  | "tax_rate"
  | "order_prefix"
  | "store_name"
  | "store_name_ar"
  | "store_email"
>;

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
    shippingZoneId: formData.get("shippingZoneId"),
    addressLine: formData.get("addressLine"),
    deliveryNotes: formData.get("deliveryNotes"),
    couponCode: formData.get("couponCode"),
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
  const settings = await getCheckoutStoreSettings();

  if (!settings.is_store_open) {
    redirectWithCheckoutError(
      settings.maintenance_message ??
        settings.maintenance_message_ar ??
        "المتجر مغلق مؤقتا ولا يستقبل طلبات جديدة."
    );
  }

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
  const couponResult = await validateCouponForSubtotal(checkout.couponCode, subtotal);

  if (!couponResult.isValid) {
    redirectWithCheckoutError(couponResult.message ?? "تعذر تطبيق كود الخصم.");
  }

  const discount = couponResult.discountAmount;
  const subtotalAfterDiscount = roundMoney(Math.max(0, subtotal - discount));

  if (subtotalAfterDiscount < settings.minimum_order_amount) {
    redirectWithCheckoutError(
      `الحد الأدنى للطلب هو ${settings.minimum_order_amount.toFixed(3)} OMR.`
    );
  }

  const shippingResult = await calculateShippingForCheckout({
    shippingZoneId: checkout.shippingZoneId,
    subtotalAfterDiscount
  });

  if (!shippingResult.isValid) {
    redirectWithCheckoutError(shippingResult.message ?? "تعذر حساب رسوم التوصيل.");
  }

  const shippingFee = roundMoney(shippingResult.shippingFee);
  const tax = settings.is_tax_enabled
    ? roundMoney(subtotalAfterDiscount * (settings.tax_rate / 100))
    : 0;
  const total = roundMoney(subtotalAfterDiscount + shippingFee + tax);
  const orderNumber = generateOrderNumber(settings.order_prefix);
  const addressSnapshot = {
    full_name: checkout.fullName,
    phone: checkout.phone,
    country: checkout.country,
    governorate: checkout.governorate,
    wilayat: checkout.wilayat,
    area: checkout.area,
    shipping_area: shippingResult.shippingArea,
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
        delivery_fee_omr: shippingFee,
        discount_omr: discount,
        tax_omr: tax,
        total_omr: total,
        coupon_code: couponResult.code,
        shipping_zone_id: shippingResult.zone?.id ?? null,
        shipping_area: shippingResult.shippingArea,
        shipping_fee_omr: shippingFee,
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

    await createOrderNotification({
      orderId: order.id,
      orderNumber,
      customerName: checkout.fullName,
      total
    });

    await sendCheckoutOrderEmails({
      storeName: getCheckoutStoreName(settings),
      adminEmail: settings.store_email,
      orderId: order.id,
      orderNumber,
      customerName: checkout.fullName,
      customerPhone: checkout.phone,
      customerEmail: checkout.email,
      items: orderLines.map((line) => ({
        name: line.product.name_ar,
        sku: line.product.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal
      })),
      subtotal,
      discount,
      shipping: shippingFee,
      tax,
      total,
      shippingArea: shippingResult.shippingArea,
      orderStatus: "قيد التأكيد"
    });

    if (couponResult.coupon) {
      await incrementCouponUsage(couponResult.coupon.id, couponResult.coupon.used_count);
    }
  } catch {
    await cleanupFailedOrder({ customerId, addressId, orderId });
    redirectWithCheckoutError("تعذر إنشاء الطلب. حاول مرة أخرى.");
  }

  redirect(`/order-confirmation/${orderNumber}?clearCart=1`);
}

async function getCheckoutStoreSettings(): Promise<CheckoutStoreSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select(
      "is_store_open,maintenance_message,maintenance_message_ar,minimum_order_amount,is_tax_enabled,tax_rate,order_prefix,store_name,store_name_ar,store_email"
    )
    .limit(1)
    .maybeSingle()
    .returns<CheckoutStoreSettings | null>();

  if (error || !data) {
    return {
      is_store_open: true,
      maintenance_message: null,
      maintenance_message_ar: null,
      minimum_order_amount: 0,
      is_tax_enabled: false,
      tax_rate: 0,
      order_prefix: "OY",
      store_name: null,
      store_name_ar: "عود ياز",
      store_email: null
    };
  }

  return data;
}

async function sendCheckoutOrderEmails({
  storeName,
  adminEmail,
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  customerEmail,
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  shippingArea,
  orderStatus
}: {
  storeName: string;
  adminEmail: string | null;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingArea: string | null;
  orderStatus: string;
}) {
  try {
    await Promise.all([
      sendEmail({
        to: customerEmail,
        subject: `تأكيد طلبك ${orderNumber}`,
        html: renderOrderConfirmationEmail({
          storeName,
          orderNumber,
          customerName,
          items,
          subtotal,
          discount,
          shipping,
          tax,
          total,
          shippingArea,
          orderStatus
        })
      }),
      sendEmail({
        to: adminEmail,
        subject: `طلب جديد ${orderNumber}`,
        html: renderAdminNewOrderEmail({
          storeName,
          orderNumber,
          customerName,
          customerPhone,
          customerEmail,
          total,
          shippingArea,
          adminOrderUrl: getAdminOrderUrl(orderId)
        }),
        replyTo: customerEmail
      })
    ]);
  } catch (error) {
    console.error("Checkout emails failed", error);
  }
}

function getCheckoutStoreName(settings: CheckoutStoreSettings) {
  return settings.store_name ?? settings.store_name_ar ?? "عود ياز";
}

function getAdminOrderUrl(orderId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (!appUrl) {
    return null;
  }

  return `${appUrl.replace(/\/$/, "")}/admin/orders/${orderId}`;
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

function generateOrderNumber(prefix = "OY") {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${year}${month}${day}-${random}`;
}

function roundMoney(value: number) {
  return Number(value.toFixed(3));
}

function redirectWithCheckoutError(message: string): never {
  const params = new URLSearchParams({ status: "error", message });
  redirect(`/checkout?${params.toString()}`);
}
