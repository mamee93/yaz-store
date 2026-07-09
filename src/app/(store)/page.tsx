import { BrandStoryPreview } from "@/components/storefront/brand-story-preview";
import {
  FeaturedCategories,
  type FeaturedCategory
} from "@/components/storefront/featured-categories";
import { GiftSetsFeature } from "@/components/storefront/gift-sets-feature";
import { HomeHero } from "@/components/storefront/home-hero";
import { OffersPreview, type OfferPreview } from "@/components/storefront/offers-preview";
import {
  ProductPreviewSection,
  type ProductPreview
} from "@/components/storefront/product-preview-section";
import { TrustStrip } from "@/components/storefront/trust-strip";
import { WhatsAppCta } from "@/components/storefront/whatsapp-cta";
import { getActiveBanners, mapBannerToOffer } from "@/features/banners/queries";
import {
  getActiveCategories,
  mapCategoryToFeaturedCategory
} from "@/features/categories/queries";
import { getActiveProducts, mapProductToPreview } from "@/features/products/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

const featuredCategories: FeaturedCategory[] = [
  {
    href: "/categories/oud",
    name: "العود",
    description: "اختيارات خشبية عميقة للمجالس والمناسبات.",
    accent: "linear-gradient(145deg, #3a2115, #8a6038)"
  },
  {
    href: "/categories/bakhoor",
    name: "البخور",
    description: "روائح دافئة للبيت والضيافة اليومية.",
    accent: "linear-gradient(145deg, #5b3925, #c59b5d)"
  },
  {
    href: "/categories/perfumes",
    name: "العطور",
    description: "تركيبات راقية للاستخدام اليومي والخاص.",
    accent: "linear-gradient(145deg, #44291c, #e2d3bc)"
  },
  {
    href: "/categories/musk",
    name: "المسك",
    description: "نعومة ثابتة ولمسة عربية نظيفة.",
    accent: "linear-gradient(145deg, #efe5d3, #b88945)"
  },
  {
    href: "/categories/gift-sets",
    name: "أطقم الهدايا",
    description: "هدايا جاهزة بتغليف فاخر ومظهر أنيق.",
    accent: "linear-gradient(145deg, #361f14, #b88945)"
  }
];

const bestSellers: ProductPreview[] = [
  {
    name: "دهن عود ملكي",
    href: "/products/royal-oud-oil",
    price: 28,
    label: "عود فاخر",
    badge: "الأكثر طلباً",
    imageTone: "linear-gradient(145deg, #361f14, #b88945)"
  },
  {
    name: "بخور المساء الخليجي",
    href: "/products/gcc-evening-bakhoor",
    price: 12.5,
    label: "بخور",
    imageTone: "linear-gradient(145deg, #573724, #e2d3bc)"
  },
  {
    name: "عطر ياز الشرقي",
    href: "/products/yaz-oriental-perfume",
    price: 19.75,
    label: "عطر",
    imageTone: "linear-gradient(145deg, #2f241f, #8c6b43)"
  },
  {
    name: "مسك أبيض ناعم",
    href: "/products/soft-white-musk",
    price: 9.9,
    label: "مسك",
    imageTone: "linear-gradient(145deg, #faf6ee, #d7b576)"
  }
];

const newArrivals: ProductPreview[] = [
  {
    name: "مجموعة ضيافة البخور",
    href: "/products/bakhoor-hosting-set",
    price: 24,
    label: "مجموعة",
    badge: "جديد",
    imageTone: "linear-gradient(145deg, #4d2d1d, #c2a06b)"
  },
  {
    name: "عود يومي هادئ",
    href: "/products/calm-daily-oud",
    price: 15.5,
    label: "عود",
    imageTone: "linear-gradient(145deg, #3a2419, #9b7448)"
  },
  {
    name: "عطر ليل مسقط",
    href: "/products/muscat-night-perfume",
    price: 22,
    label: "عطر",
    imageTone: "linear-gradient(145deg, #241c19, #b88945)"
  },
  {
    name: "هدية ياز الصغيرة",
    href: "/products/yaz-small-gift",
    price: 18.25,
    label: "هدية",
    imageTone: "linear-gradient(145deg, #7a5030, #efe5d3)"
  }
];

const offers: OfferPreview[] = [
  {
    title: "مختارات البداية",
    description: "مجموعة مناسبة لتجربة عود ياز لأول مرة بروائح متوازنة.",
    href: "/offers",
    tone: "linear-gradient(145deg, #361f14, #b88945)"
  },
  {
    title: "هدايا المناسبات",
    description: "أطقم مختارة للزيارات والأعياد والتقديم الرسمي.",
    href: "/offers",
    tone: "linear-gradient(145deg, #573724, #e2d3bc)"
  },
  {
    title: "روائح البيت",
    description: "بخور ومسك بروائح دافئة تناسب الضيافة اليومية.",
    href: "/offers",
    tone: "linear-gradient(145deg, #2f241f, #8a6038)"
  }
];

export default async function HomePage() {
  const [categoryRows, productRows, heroBannerRows, offerBannerRows, settings] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(),
    getActiveBanners("home_hero"),
    getActiveBanners("offers"),
    getStoreSettings()
  ]);

  const resolvedCategories =
    categoryRows.length > 0
      ? categoryRows.slice(0, 5).map(mapCategoryToFeaturedCategory)
      : featuredCategories;

  const resolvedBestSellers =
    productRows.length > 0
      ? productRows
          .filter((product) => product.is_best_seller || product.is_featured)
          .slice(0, 4)
          .map(mapProductToPreview)
      : bestSellers;

  const resolvedNewArrivals =
    productRows.length > 0
      ? productRows
          .filter((product) => product.is_new_arrival)
          .slice(0, 4)
          .map(mapProductToPreview)
      : newArrivals;

  const resolvedOffers =
    offerBannerRows.length > 0 ? offerBannerRows.slice(0, 3).map(mapBannerToOffer) : offers;

  return (
    <>
      <HomeHero banner={heroBannerRows[0] ?? null} />
      <FeaturedCategories categories={resolvedCategories} />
      <ProductPreviewSection
        eyebrow="الأكثر طلباً"
        title="الأكثر مبيعاً"
        description="منتجات يختارها العملاء للثبات، الفخامة، وسهولة الإهداء."
        products={resolvedBestSellers.length > 0 ? resolvedBestSellers : bestSellers}
        href="/products"
      />
      <GiftSetsFeature />
      <TrustStrip />
      <ProductPreviewSection
        eyebrow="وصل حديثاً"
        title="وصل حديثاً"
        description="إضافات جديدة بتوازن بين الطابع العربي والفخامة اليومية."
        products={resolvedNewArrivals.length > 0 ? resolvedNewArrivals : newArrivals}
        href="/products"
        tone="beige"
      />
      <OffersPreview offers={resolvedOffers} />
      <BrandStoryPreview story={settings?.brand_story_ar} />
      <WhatsAppCta />
    </>
  );
}
