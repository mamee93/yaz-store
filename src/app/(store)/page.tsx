import {
  FeaturedCategories,
  type FeaturedCategory
} from "@/components/storefront/featured-categories";
import { HomeFaq } from "@/components/storefront/home-faq";
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
    badge: "الأكثر طلبا",
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
  const [categoryRows, productRows, heroBannerRows, offerBannerRows] = await Promise.all([
    getActiveCategories(),
    getActiveProducts(),
    getActiveBanners("home_hero"),
    getActiveBanners("offers")
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

  const resolvedOffers =
    offerBannerRows.length > 0 ? offerBannerRows.slice(0, 3).map(mapBannerToOffer) : offers;

  return (
    <>
      <HomeHero banner={heroBannerRows[0] ?? null} />
      <FeaturedCategories categories={resolvedCategories} />
      <ProductPreviewSection
        eyebrow="الأكثر طلبا"
        title="أفضل اختيارات عود ياز"
        description="منتجات يختارها العملاء للثبات، الفخامة، وسهولة الإهداء."
        products={resolvedBestSellers.length > 0 ? resolvedBestSellers : bestSellers}
        href="/products"
      />
      <OffersPreview offers={resolvedOffers} />
      <TrustStrip />
      <WhatsAppCta />
      <HomeFaq />
    </>
  );
}
