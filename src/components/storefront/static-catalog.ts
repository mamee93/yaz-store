export type StoreCategory = {
  slug: string;
  name: string;
  description: string;
  imageTone: string;
};

export type StoreProduct = {
  id?: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number;
  label: string;
  shortDescription: string;
  description: string;
  scentProfile: string[];
  usage: string[];
  occasions: string[];
  sizeLabel: string;
  intensity: string;
  stockLabel: string;
  imageTone: string;
  imageUrl?: string;
  imageAlt?: string;
  images?: StoreProductImage[];
  badge?: string;
};

export type StoreProductImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type StoreOffer = {
  title: string;
  description: string;
  href: string;
  tone: string;
  label: string;
};

export const storeCategories: StoreCategory[] = [
  {
    slug: "oud",
    name: "العود",
    description: "دهن عود وقطع مختارة بطابع خشبي عميق للمجالس والمناسبات.",
    imageTone: "linear-gradient(145deg, #361f14, #9a6a3d)"
  },
  {
    slug: "bakhoor",
    name: "البخور",
    description: "بخور فاخر بروائح دافئة للبيت والضيافة اليومية.",
    imageTone: "linear-gradient(145deg, #573724, #d7b576)"
  },
  {
    slug: "perfumes",
    name: "العطور",
    description: "عطور عربية وشرقية للاستخدام اليومي واللحظات الخاصة.",
    imageTone: "linear-gradient(145deg, #2f241f, #b88945)"
  },
  {
    slug: "musk",
    name: "المسك",
    description: "مسك ناعم ونظيف بثبات هادئ ولمسة فاخرة.",
    imageTone: "linear-gradient(145deg, #faf6ee, #d7b576)"
  },
  {
    slug: "gift-sets",
    name: "أطقم الهدايا",
    description: "مجموعات جاهزة للإهداء بتغليف راق ومظهر أنيق.",
    imageTone: "linear-gradient(145deg, #3a2115, #b88945)"
  }
];

export const storeProducts: StoreProduct[] = [
  {
    slug: "royal-oud-oil",
    name: "دهن عود ملكي",
    categorySlug: "oud",
    categoryName: "العود",
    price: 28,
    compareAtPrice: 34,
    label: "عود فاخر",
    badge: "الأكثر طلباً",
    shortDescription: "دهن عود عميق بطابع خشبي ودخاني راق.",
    description:
      "اختيار فاخر لمحبي العود الشرقي العميق، مناسب للمجالس والمناسبات الخاصة والإهداء الرسمي.",
    scentProfile: ["خشبي", "دخاني", "دافئ"],
    usage: ["توضع كمية خفيفة على نقاط النبض", "مناسب للاستخدام المسائي"],
    occasions: ["المجالس", "المناسبات", "الهدايا"],
    sizeLabel: "12 مل",
    intensity: "قوي",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #361f14, #b88945)"
  },
  {
    slug: "gcc-evening-bakhoor",
    name: "بخور المساء الخليجي",
    categorySlug: "bakhoor",
    categoryName: "البخور",
    price: 12.5,
    label: "بخور",
    shortDescription: "بخور دافئ يترك أثراً ناعماً في المكان.",
    description:
      "رائحة مناسبة للمساء والضيافة، تجمع بين الدفء العربي ولمسة هادئة لا تطغى على المكان.",
    scentProfile: ["عنبر", "خشب", "حلاوة خفيفة"],
    usage: ["يوضع على مبخرة ساخنة", "استخدم كمية صغيرة لبداية متوازنة"],
    occasions: ["الضيافة", "البيت", "الزيارات"],
    sizeLabel: "50 جم",
    intensity: "متوسط",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #573724, #e2d3bc)"
  },
  {
    slug: "yaz-oriental-perfume",
    name: "عطر ياز الشرقي",
    categorySlug: "perfumes",
    categoryName: "العطور",
    price: 19.75,
    label: "عطر",
    shortDescription: "عطر شرقي بتوازن بين الفخامة والهدوء.",
    description:
      "تركيبة أنيقة للاستخدام اليومي والخاص، تمنح حضوراً عربياً واضحاً دون مبالغة.",
    scentProfile: ["زهري", "مسك", "خشب"],
    usage: ["يرش على الملابس من مسافة مناسبة", "يحفظ بعيداً عن الحرارة"],
    occasions: ["اليوميات", "العمل", "المناسبات"],
    sizeLabel: "100 مل",
    intensity: "متوسط",
    stockLabel: "كمية محدودة",
    imageTone: "linear-gradient(145deg, #2f241f, #8c6b43)"
  },
  {
    slug: "soft-white-musk",
    name: "مسك أبيض ناعم",
    categorySlug: "musk",
    categoryName: "المسك",
    price: 9.9,
    label: "مسك",
    shortDescription: "مسك نظيف وناعم للاستخدام اليومي.",
    description:
      "اختيار خفيف وراق لمن يحب الرائحة النظيفة الهادئة، مناسب بعد الاستحمام أو قبل الخروج.",
    scentProfile: ["نظيف", "بودري", "ناعم"],
    usage: ["يستخدم بكمية بسيطة", "مناسب للاستخدام اليومي"],
    occasions: ["اليوميات", "الهدايا الصغيرة", "السفر"],
    sizeLabel: "6 مل",
    intensity: "خفيف",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #faf6ee, #d7b576)"
  },
  {
    slug: "bakhoor-hosting-set",
    name: "مجموعة ضيافة البخور",
    categorySlug: "gift-sets",
    categoryName: "أطقم الهدايا",
    price: 24,
    label: "مجموعة",
    badge: "جديد",
    shortDescription: "طقم بخور فاخر مناسب للضيافة والإهداء.",
    description:
      "مجموعة أنيقة تضم اختيارات بخور بروائح متعددة، مناسبة للبيت والزيارات والمناسبات.",
    scentProfile: ["دافئ", "شرقي", "عنبر"],
    usage: ["استخدم كل نوع حسب المناسبة", "يحفظ في مكان جاف"],
    occasions: ["الهدايا", "الزيارات", "الأعياد"],
    sizeLabel: "3 قطع",
    intensity: "متنوع",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #4d2d1d, #c2a06b)"
  },
  {
    slug: "calm-daily-oud",
    name: "عود يومي هادئ",
    categorySlug: "oud",
    categoryName: "العود",
    price: 15.5,
    label: "عود",
    shortDescription: "عود متوازن للاستخدام اليومي.",
    description:
      "رائحة عود هادئة ومناسبة لمن يريد حضوراً عربياً ناعماً في اليوميات دون ثقل.",
    scentProfile: ["خشبي", "ناعم", "دافئ"],
    usage: ["مناسب للاستخدام الصباحي", "كمية صغيرة تكفي"],
    occasions: ["اليوميات", "العمل", "الزيارات"],
    sizeLabel: "9 مل",
    intensity: "خفيف إلى متوسط",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #3a2419, #9b7448)"
  },
  {
    slug: "muscat-night-perfume",
    name: "عطر ليل مسقط",
    categorySlug: "perfumes",
    categoryName: "العطور",
    price: 22,
    label: "عطر",
    badge: "جديد",
    shortDescription: "عطر مسائي داكن بلمسة ذهبية.",
    description:
      "عطر فاخر للمساء، يجمع بين العمق الشرقي ولمسة ناعمة تناسب السهرات والمناسبات.",
    scentProfile: ["توابل", "خشب", "مسك"],
    usage: ["يرش على الملابس", "مناسب للمساء"],
    occasions: ["السهرات", "المناسبات", "الهدايا"],
    sizeLabel: "75 مل",
    intensity: "قوي",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #241c19, #b88945)"
  },
  {
    slug: "yaz-small-gift",
    name: "هدية ياز الصغيرة",
    categorySlug: "gift-sets",
    categoryName: "أطقم الهدايا",
    price: 18.25,
    label: "هدية",
    shortDescription: "هدية صغيرة راقية بتجربة عطرية متكاملة.",
    description:
      "اختيار مناسب للهدايا السريعة واللطيفة، بتغليف جميل ومكونات عطرية مختارة.",
    scentProfile: ["متنوع", "ناعم", "فاخر"],
    usage: ["جاهزة للإهداء", "يمكن إضافة ملاحظة عند الطلب لاحقاً"],
    occasions: ["الشكر", "الزيارات", "الأعياد"],
    sizeLabel: "طقم صغير",
    intensity: "متوازن",
    stockLabel: "متوفر",
    imageTone: "linear-gradient(145deg, #7a5030, #efe5d3)"
  }
];

export const storeOffers: StoreOffer[] = [
  {
    title: "مختارات البداية",
    description: "مجموعة مناسبة لتجربة عود ياز لأول مرة بروائح متوازنة.",
    href: "/offers#starter",
    label: "عرض محدود",
    tone: "linear-gradient(145deg, #361f14, #b88945)"
  },
  {
    title: "هدايا المناسبات",
    description: "أطقم مختارة للزيارات والأعياد والتقديم الرسمي.",
    href: "/offers#gifts",
    label: "للإهداء",
    tone: "linear-gradient(145deg, #573724, #e2d3bc)"
  },
  {
    title: "روائح البيت",
    description: "بخور ومسك بروائح دافئة تناسب الضيافة اليومية.",
    href: "/offers#home",
    label: "مختارات البيت",
    tone: "linear-gradient(145deg, #2f241f, #8a6038)"
  }
];

export function getProductBySlug(slug: string) {
  return storeProducts.find((product) => product.slug === slug) ?? storeProducts[0];
}

export function getCategoryBySlug(slug: string) {
  return storeCategories.find((category) => category.slug === slug) ?? storeCategories[0];
}

export function getProductsByCategory(slug: string) {
  return storeProducts.filter((product) => product.categorySlug === slug);
}
