import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui";
import type { BannerRead } from "@/features/banners/queries";

type HomeHeroProps = {
  banner?: BannerRead | null;
};

export function HomeHero({ banner }: HomeHeroProps) {
  const title = banner?.title_ar ?? "عود ياز";
  const description =
    banner?.subtitle_ar ??
    "مختارات فاخرة من العود والبخور والعطور الشرقية، بتجربة شراء واضحة وسريعة تناسب ذائقة عمان والخليج.";
  const primaryHref = banner?.link_url ?? "/products";
  const primaryLabel = banner?.button_label_ar ?? "تسوق الآن";

  return (
    <section className="relative isolate min-h-[calc(100svh-var(--site-header-height))] overflow-hidden bg-oud-brown text-oud-ivory">
      {banner?.image_url ? (
        <Image
          src={banner.image_url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(54_31_20),rgb(87_55_36)_58%,rgb(184_137_69))]" />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(35_28_24_/_0.86),rgb(54_31_20_/_0.62),rgb(54_31_20_/_0.18))]" />

      <Container size="wide" className="relative flex min-h-[calc(100svh-var(--site-header-height))] items-end py-8 sm:py-12 lg:items-center">
        <div className="max-w-3xl space-y-6 pb-8 sm:pb-10 lg:pb-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-oud-gold/35 bg-oud-brown/45 px-4 py-2 text-xs font-semibold text-oud-beige backdrop-blur-sm">
            <ShieldCheck className="size-4 text-oud-gold" aria-hidden="true" />
            متجر عطور عربي فاخر
          </div>

          <div className="space-y-4">
            <h1 className="text-pretty font-display text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-oud-beige sm:text-lg">
              {description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center rounded-oud bg-oud-gold px-8 text-sm font-bold text-oud-brown shadow-gold transition hover:bg-oud-gold-soft"
            >
              {primaryLabel}
            </Link>
            <Link
              href="/offers"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-oud border border-oud-ivory/30 bg-oud-ivory/10 px-8 text-sm font-bold text-oud-ivory backdrop-blur-sm transition hover:border-oud-gold/60 hover:text-oud-gold"
            >
              اكتشف العروض
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid max-w-2xl gap-3 pt-3 text-xs text-oud-beige sm:grid-cols-3">
            <span className="border-r border-oud-gold/40 pr-3">توصيل داخل عمان</span>
            <span className="border-r border-oud-gold/40 pr-3">تغليف فاخر للهدايا</span>
            <span className="border-r border-oud-gold/40 pr-3">دعم سريع عبر واتساب</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
