export const OMAN_GOVERNORATES = [
  {
    name: "مسقط",
    wilayats: ["مسقط", "مطرح", "بوشر", "السيب", "العامرات", "قريات"]
  },
  {
    name: "ظفار",
    wilayats: [
      "صلالة",
      "طاقة",
      "مرباط",
      "رخيوت",
      "ثمريت",
      "ضلكوت",
      "سدح",
      "المزيونة",
      "مقشن",
      "شليم وجزر الحلانيات"
    ]
  },
  {
    name: "مسندم",
    wilayats: ["خصب", "بخاء", "دبا", "مدحاء"]
  },
  {
    name: "البريمي",
    wilayats: ["البريمي", "محضة", "السنينة"]
  },
  {
    name: "الداخلية",
    wilayats: ["نزوى", "بهلاء", "منح", "الحمراء", "أدم", "إزكي", "سمائل", "بدبد"]
  },
  {
    name: "شمال الباطنة",
    wilayats: ["صحار", "شناص", "لوى", "صحم", "الخابورة", "السويق"]
  },
  {
    name: "جنوب الباطنة",
    wilayats: ["الرستاق", "العوابي", "نخل", "وادي المعاول", "بركاء", "المصنعة"]
  },
  {
    name: "جنوب الشرقية",
    wilayats: ["صور", "الكامل والوافي", "جعلان بني بوعلي", "جعلان بني بو حسن", "مصيرة"]
  },
  {
    name: "شمال الشرقية",
    wilayats: ["إبراء", "المضيبي", "بدية", "القابل", "وادي بني خالد", "دماء والطائيين"]
  },
  {
    name: "الظاهرة",
    wilayats: ["عبري", "ينقل", "ضنك"]
  },
  {
    name: "الوسطى",
    wilayats: ["هيما", "محوت", "الدقم", "الجازر"]
  }
] as const;

export const DELIVERY_METHODS = [
  {
    id: "pickup_office",
    label: "استلام من المكتب",
    description: "استلام الطلب من مكتب عود ياز بعد تأكيد التجهيز.",
    fee: 1
  },
  {
    id: "home_delivery",
    label: "توصيل للمنزل",
    description: "توصيل الطلب إلى العنوان التفصيلي داخل سلطنة عمان.",
    fee: 2
  }
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["id"];

export function getDeliveryMethod(methodId: string | null | undefined) {
  return DELIVERY_METHODS.find((method) => method.id === methodId) ?? null;
}

export function getDeliveryFee(methodId: string | null | undefined) {
  return getDeliveryMethod(methodId)?.fee ?? 0;
}

export function getGovernorateWilayats(governorate: string): readonly string[] {
  return OMAN_GOVERNORATES.find((item) => item.name === governorate)?.wilayats ?? [];
}
