import { requireAdmin } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export type AnalyticsOrder = {
  id: string;
  order_number: string;
  customer_id: string;
  status: OrderStatus;
  total_omr: number;
  subtotal_omr: number;
  discount_omr: number;
  coupon_code: string | null;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  confirmed_by_admin_id: string | null;
  completed_by_admin_id: string | null;
  cancelled_by_admin_id: string | null;
  created_at: string;
};

export type AnalyticsOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_ar_snapshot: string;
  sku_snapshot: string | null;
  quantity: number;
  line_total_omr: number;
};

export type AnalyticsCustomer = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

export type AnalyticsProduct = {
  id: string;
  name_ar: string;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  deleted_at: string | null;
};

export type AnalyticsCoupon = {
  id: string;
  code: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  used_count: number;
  is_active: boolean;
};

export type AnalyticsAdminLite = {
  id: string;
  full_name: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  last_sign_in_at: string | null;
};

export type DashboardAnalytics = {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    averageOrderValue: number;
    todayRevenue: number;
    last30DaysRevenue: number;
    todayOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    cancelledOrders: number;
    newCustomers30Days: number;
  };
  statusCounts: Record<OrderStatus, number>;
  sales7Days: SalesTrendPoint[];
  sales30Days: SalesTrendPoint[];
  topProducts: TopProductItem[];
  topCustomers: TopCustomerItem[];
  lowStockProducts: LowStockProductItem[];
  recentOrders: RecentOrderItem[];
  couponPerformance: CouponPerformanceItem[];
  alerts: DashboardAlert[];
};

export type SalesTrendPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export type TopProductItem = {
  productId: string | null;
  name: string;
  sku: string | null;
  quantitySold: number;
  revenue: number;
};

export type TopCustomerItem = {
  customerId: string;
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  totalSpent: number;
};

export type LowStockProductItem = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  threshold: number;
};

export type RecentOrderItem = {
  id: string;
  orderNumber: string;
  customer: string;
  phone: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  attributedAdminName: string | null;
};

export type CouponPerformanceItem = {
  code: string;
  name: string;
  usedCount: number;
  revenue: number;
  discount: number;
  isActive: boolean;
};

export type DashboardAlert = {
  id: string;
  label: string;
  count: number;
};

const orderStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
  "cancelled"
];

const analyticsLimits = {
  orders: 5000,
  orderItems: 10000,
  customers: 5000,
  products: 1000,
  coupons: 1000,
  admins: 500
};

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const admin = await requireAdmin();

  if (!admin) {
    return getEmptyAnalytics();
  }

  const supabase = await createClient();
  const [
    { data: orders, error: ordersError },
    { data: orderItems, error: orderItemsError },
    { data: customers, error: customersError },
    { data: products, error: productsError },
    { data: coupons, error: couponsError },
    { data: admins, error: adminsError }
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id,order_number,customer_id,status,total_omr,subtotal_omr,discount_omr,coupon_code,customer_name_snapshot,customer_phone_snapshot,created_by_admin_id,updated_by_admin_id,confirmed_by_admin_id,completed_by_admin_id,cancelled_by_admin_id,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(analyticsLimits.orders)
      .returns<AnalyticsOrder[]>(),
    supabase
      .from("order_items")
      .select("id,order_id,product_id,product_name_ar_snapshot,sku_snapshot,quantity,line_total_omr")
      .limit(analyticsLimits.orderItems)
      .returns<AnalyticsOrderItem[]>(),
    supabase
      .from("customers")
      .select("id,full_name,phone,email,created_at")
      .limit(analyticsLimits.customers)
      .returns<AnalyticsCustomer[]>(),
    supabase
      .from("products")
      .select("id,name_ar,sku,stock_quantity,low_stock_threshold,is_active,deleted_at")
      .limit(analyticsLimits.products)
      .returns<AnalyticsProduct[]>(),
    supabase
      .from("coupons")
      .select("id,code,name,discount_type,discount_value,used_count,is_active")
      .limit(analyticsLimits.coupons)
      .returns<AnalyticsCoupon[]>(),
    supabase
      .from("admins")
      .select("id,full_name,display_name,role,is_active,last_sign_in_at")
      .limit(analyticsLimits.admins)
      .returns<AnalyticsAdminLite[]>()
  ]);

  if (ordersError || orderItemsError || customersError || productsError || couponsError || adminsError) {
    console.error(
      "Failed to read dashboard analytics",
      ordersError ?? orderItemsError ?? customersError ?? productsError ?? couponsError ?? adminsError
    );
    return getEmptyAnalytics();
  }

  return buildDashboardAnalytics({
    orders: orders ?? [],
    orderItems: orderItems ?? [],
    customers: customers ?? [],
    products: products ?? [],
    coupons: coupons ?? [],
    admins: admins ?? []
  });
}

function buildDashboardAnalytics({
  orders,
  orderItems,
  customers,
  products,
  coupons,
  admins
}: {
  orders: AnalyticsOrder[];
  orderItems: AnalyticsOrderItem[];
  customers: AnalyticsCustomer[];
  products: AnalyticsProduct[];
  coupons: AnalyticsCoupon[];
  admins: AnalyticsAdminLite[];
}): DashboardAnalytics {
  const revenueOrders = orders.filter((order) => order.status === "completed");
  const totalRevenue = sum(revenueOrders.map((order) => order.total_omr));
  const todayKey = toDateKey(new Date());
  const last30Start = new Date();
  last30Start.setDate(last30Start.getDate() - 29);
  last30Start.setHours(0, 0, 0, 0);
  const todayRevenue = sum(
    revenueOrders.filter((order) => toDateKey(order.created_at) === todayKey).map((order) => order.total_omr)
  );
  const last30DaysRevenue = sum(
    revenueOrders.filter((order) => new Date(order.created_at) >= last30Start).map((order) => order.total_omr)
  );
  const completedOrders = orders.filter((order) => order.status === "completed").length;
  const cancelledOrders = orders.filter((order) => order.status === "cancelled").length;
  const inProgressOrders = orders.filter((order) =>
    ["confirmed", "preparing", "out_for_delivery"].includes(order.status)
  ).length;
  const averageOrderValue =
    revenueOrders.length > 0 ? roundMoney(totalRevenue / revenueOrders.length) : 0;
  const revenueOrderIds = new Set(revenueOrders.map((order) => order.id));
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const adminsById = new Map(admins.map((admin) => [admin.id, admin]));

  return {
    kpis: {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      averageOrderValue,
      todayRevenue,
      last30DaysRevenue,
      todayOrders: orders.filter((order) => toDateKey(order.created_at) === todayKey).length,
      completedOrders,
      inProgressOrders,
      cancelledOrders,
      newCustomers30Days: customers.filter((customer) => new Date(customer.created_at) >= last30Start).length
    },
    statusCounts: buildStatusCounts(orders),
    sales7Days: buildSalesTrend(revenueOrders, 7),
    sales30Days: buildSalesTrend(revenueOrders, 30),
    topProducts: buildTopProducts(orderItems, revenueOrderIds),
    topCustomers: buildTopCustomers(revenueOrders, customers),
    lowStockProducts: products
      .filter((product) => product.deleted_at === null && product.is_active)
      .filter((product) => product.stock_quantity <= product.low_stock_threshold)
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 8)
      .map((product) => ({
        id: product.id,
        name: product.name_ar,
        sku: product.sku,
        stock: product.stock_quantity,
        threshold: product.low_stock_threshold
      })),
    recentOrders: orders.slice(0, 8).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: order.customer_name_snapshot,
      phone: order.customer_phone_snapshot,
      status: order.status,
      total: order.total_omr,
      createdAt: order.created_at,
      attributedAdminName: getAttributedAdminName(order, adminsById)
    })),
    couponPerformance: buildCouponPerformance(coupons, revenueOrders, ordersById),
    alerts: buildDashboardAlerts(orders, admins)
  };
}

function getAttributedAdminName(
  order: AnalyticsOrder,
  adminsById: Map<string, AnalyticsAdminLite>
) {
  const adminId =
    order.cancelled_by_admin_id ??
    order.completed_by_admin_id ??
    order.confirmed_by_admin_id ??
    order.updated_by_admin_id ??
    order.created_by_admin_id;
  const admin = adminId ? adminsById.get(adminId) : null;

  return admin ? admin.display_name || admin.full_name : null;
}

function buildStatusCounts(orders: AnalyticsOrder[]) {
  const counts = Object.fromEntries(orderStatuses.map((status) => [status, 0])) as Record<
    OrderStatus,
    number
  >;

  for (const order of orders) {
    counts[order.status] += 1;
  }

  return counts;
}

function buildSalesTrend(orders: AnalyticsOrder[], days: number) {
  const today = new Date();
  const points: SalesTrendPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = toDateKey(date);
    const dayOrders = orders.filter((order) => toDateKey(order.created_at) === key);

    points.push({
      date: key,
      label: new Intl.DateTimeFormat("ar-OM", {
        day: "numeric",
        month: "short"
      }).format(date),
      revenue: sum(dayOrders.map((order) => order.total_omr)),
      orders: dayOrders.length
    });
  }

  return points;
}

function buildTopProducts(orderItems: AnalyticsOrderItem[], revenueOrderIds: Set<string>) {
  const grouped = new Map<string, TopProductItem>();

  for (const item of orderItems) {
    if (!revenueOrderIds.has(item.order_id)) {
      continue;
    }

    const key = item.product_id ?? item.product_name_ar_snapshot;
    const current = grouped.get(key) ?? {
      productId: item.product_id,
      name: item.product_name_ar_snapshot,
      sku: item.sku_snapshot,
      quantitySold: 0,
      revenue: 0
    };

    current.quantitySold += item.quantity;
    current.revenue = roundMoney(current.revenue + item.line_total_omr);
    grouped.set(key, current);
  }

  return [...grouped.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
}

function buildTopCustomers(orders: AnalyticsOrder[], customers: AnalyticsCustomer[]) {
  const customersById = new Map(customers.map((customer) => [customer.id, customer]));
  const grouped = new Map<string, TopCustomerItem>();

  for (const order of orders) {
    const customer = customersById.get(order.customer_id);
    const current = grouped.get(order.customer_id) ?? {
      customerId: order.customer_id,
      name: customer?.full_name ?? order.customer_name_snapshot,
      phone: customer?.phone ?? order.customer_phone_snapshot,
      email: customer?.email ?? null,
      orders: 0,
      totalSpent: 0
    };

    current.orders += 1;
    current.totalSpent = roundMoney(current.totalSpent + order.total_omr);
    grouped.set(order.customer_id, current);
  }

  return [...grouped.values()].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8);
}

function buildCouponPerformance(
  coupons: AnalyticsCoupon[],
  orders: AnalyticsOrder[],
  ordersById: Map<string, AnalyticsOrder>
) {
  const grouped = new Map<string, CouponPerformanceItem>();

  for (const coupon of coupons) {
    grouped.set(coupon.code, {
      code: coupon.code,
      name: coupon.name,
      usedCount: coupon.used_count,
      revenue: 0,
      discount: 0,
      isActive: coupon.is_active
    });
  }

  for (const order of orders) {
    if (!order.coupon_code) {
      continue;
    }

    const current = grouped.get(order.coupon_code) ?? {
      code: order.coupon_code,
      name: order.coupon_code,
      usedCount: 0,
      revenue: 0,
      discount: 0,
      isActive: false
    };

    const sourceOrder = ordersById.get(order.id) ?? order;
    current.revenue = roundMoney(current.revenue + sourceOrder.total_omr);
    current.discount = roundMoney(current.discount + sourceOrder.discount_omr);
    grouped.set(order.coupon_code, current);
  }

  return [...grouped.values()]
    .filter((coupon) => coupon.usedCount > 0 || coupon.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
}

function buildDashboardAlerts(orders: AnalyticsOrder[], admins: AnalyticsAdminLite[]) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const fourteenDaysMs = 14 * dayMs;
  const pendingOver24h = orders.filter(
    (order) => order.status === "pending" && now - new Date(order.created_at).getTime() > dayMs
  ).length;
  const delayedActiveOrders = orders.filter(
    (order) =>
      (order.status === "confirmed" || order.status === "preparing") &&
      now - new Date(order.created_at).getTime() > dayMs
  ).length;
  const inactiveAdmins = admins.filter(
    (admin) =>
      admin.is_active &&
      (!admin.last_sign_in_at || now - new Date(admin.last_sign_in_at).getTime() > fourteenDaysMs)
  ).length;

  return [
    pendingOver24h > 0
      ? { id: "pending-over-24h", label: "طلبات pending منذ أكثر من 24 ساعة", count: pendingOver24h }
      : null,
    delayedActiveOrders > 0
      ? { id: "delayed-active-orders", label: "طلبات مؤكدة أو قيد التجهيز متأخرة", count: delayedActiveOrders }
      : null,
    inactiveAdmins > 0
      ? { id: "inactive-admins", label: "إداريون لم يسجلوا الدخول منذ 14 يوما", count: inactiveAdmins }
      : null
  ].filter((alert): alert is DashboardAlert => Boolean(alert));
}

function getEmptyAnalytics(): DashboardAnalytics {
  return {
    kpis: {
      totalRevenue: 0,
      totalOrders: 0,
      totalCustomers: 0,
      averageOrderValue: 0,
      todayRevenue: 0,
      last30DaysRevenue: 0,
      todayOrders: 0,
      completedOrders: 0,
      inProgressOrders: 0,
      cancelledOrders: 0,
      newCustomers30Days: 0
    },
    statusCounts: buildStatusCounts([]),
    sales7Days: buildSalesTrend([], 7),
    sales30Days: buildSalesTrend([], 30),
    topProducts: [],
    topCustomers: [],
    lowStockProducts: [],
    recentOrders: [],
    couponPerformance: [],
    alerts: []
  };
}

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function sum(values: number[]) {
  return roundMoney(values.reduce((total, value) => total + Number(value), 0));
}

function roundMoney(value: number) {
  return Number(value.toFixed(3));
}
