export const adminProducts = [
  {
    id: "prd_001",
    name: "دهن عود ملكي",
    category: "العود",
    sku: "OY-OUD-001",
    price: 28,
    stock: 12,
    status: "نشط",
    featured: true
  },
  {
    id: "prd_002",
    name: "بخور المساء الخليجي",
    category: "البخور",
    sku: "OY-BKH-002",
    price: 12.5,
    stock: 18,
    status: "نشط",
    featured: false
  },
  {
    id: "prd_003",
    name: "عطر ياز الشرقي",
    category: "العطور",
    sku: "OY-PER-003",
    price: 19.75,
    stock: 3,
    status: "نشط",
    featured: true
  },
  {
    id: "prd_004",
    name: "مسك أبيض ناعم",
    category: "المسك",
    sku: "OY-MSK-004",
    price: 9.9,
    stock: 4,
    status: "مخفي",
    featured: false
  }
];

export const adminCategories = [
  { id: "cat_oud", name: "العود", slug: "oud", products: 8, status: "نشط", featured: true },
  { id: "cat_bakhoor", name: "البخور", slug: "bakhoor", products: 6, status: "نشط", featured: true },
  { id: "cat_perfumes", name: "العطور", slug: "perfumes", products: 10, status: "نشط", featured: false },
  { id: "cat_gifts", name: "أطقم الهدايا", slug: "gift-sets", products: 5, status: "نشط", featured: true }
];

export const adminOrders = [
  {
    id: "ord_001",
    orderNumber: "OY-000128",
    customer: "أحمد الهاشمي",
    phone: "9XXXX123",
    total: 52.5,
    status: "قيد التأكيد",
    payment: "الدفع عند الاستلام",
    date: "اليوم"
  },
  {
    id: "ord_002",
    orderNumber: "OY-000127",
    customer: "مريم البلوشية",
    phone: "9XXXX884",
    total: 28,
    status: "قيد التجهيز",
    payment: "التحويل البنكي",
    date: "اليوم"
  },
  {
    id: "ord_003",
    orderNumber: "OY-000126",
    customer: "سالم الحارثي",
    phone: "9XXXX451",
    total: 19.75,
    status: "مكتمل",
    payment: "تأكيد عبر واتساب",
    date: "أمس"
  }
];

export const adminCustomers = [
  { id: "cus_001", name: "أحمد الهاشمي", phone: "9XXXX123", email: "ahmad@example.com", orders: 3, spent: 92.5 },
  { id: "cus_002", name: "مريم البلوشية", phone: "9XXXX884", email: "maryam@example.com", orders: 1, spent: 28 },
  { id: "cus_003", name: "سالم الحارثي", phone: "9XXXX451", email: "salim@example.com", orders: 2, spent: 46.75 }
];

export const adminInventory = [
  { id: "inv_001", product: "عطر ياز الشرقي", sku: "OY-PER-003", stock: 3, threshold: 5, lastMovement: "بيع" },
  { id: "inv_002", product: "مسك أبيض ناعم", sku: "OY-MSK-004", stock: 4, threshold: 6, lastMovement: "تعديل" },
  { id: "inv_003", product: "هدية ياز الصغيرة", sku: "OY-GFT-008", stock: 2, threshold: 5, lastMovement: "بيع" }
];

export const adminBanners = [
  { id: "ban_001", title: "فخامة العود", placement: "الرئيسية", status: "نشط", sort: 1 },
  { id: "ban_002", title: "هدايا المناسبات", placement: "العروض", status: "نشط", sort: 2 },
  { id: "ban_003", title: "روائح البيت", placement: "الرئيسية", status: "مجدول", sort: 3 }
];
