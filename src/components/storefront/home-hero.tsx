import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { Container } from "@/components/ui";
import type { BannerRead } from "@/features/banners/queries";

type HomeHeroProps = {
  banner?: BannerRead | null;
};

const heroFeatures = [
  {
    icon: Truck,
    title: "شحن سريع",
    description: "إلى جميع مناطق السلطنة"
  },
  {
    icon: Sparkles,
    title: "منتجات أصلية",
    description: "جودة مختارة بعناية"
  },
  {
    icon: CreditCard,
    title: "دفع آمن",
    description: "خيارات دفع موثوقة وآمنة"
  }
];

export function HomeHero({ banner }: HomeHeroProps) {
  const desktopImage = banner?.image_url?.trim() || null;

  const mobileImage =
    banner?.mobile_image_url?.trim() ||
    desktopImage;

  const title = banner?.title_ar?.trim() || "عود ياز";

  const description =
    banner?.subtitle_ar?.trim() ||
    "نفحات أصيلة... تجربة عطرية فاخرة مستوحاة من التراث العربي";

  const primaryButtonLabel =
    banner?.button_label_ar?.trim() || "تسوق الآن";

  const primaryButtonHref =
    banner?.link_url?.trim() || "/products";

  return (
    <section
      className="relative isolate overflow-hidden bg-[#f7eee7]"
      dir="rtl"
    >
      <div className="relative">
        {/* صورة الكمبيوتر — مثبتة جهة اليسار */}
        {desktopImage ? (
          <div
            className="
              absolute inset-0 hidden
              bg-cover bg-left bg-no-repeat
              md:block
            "
            style={{
              backgroundImage: `url("${desktopImage}")`
            }}
            aria-hidden="true"
          />
        ) : null}

        {/* صورة الهاتف */}
        {mobileImage ? (
          <div
            className="
              absolute inset-0
              bg-cover bg-center bg-no-repeat
              md:hidden
            "
            style={{
              backgroundImage: `url("${mobileImage}")`
            }}
            aria-hidden="true"
          />
        ) : null}

        {/* تدرج الكمبيوتر:
            الصورة تبقى واضحة يسارًا،
            والخلفية تصبح فاتحة يمينًا خلف النص */}
        <div
          className="
            absolute inset-0 hidden md:block
            bg-[linear-gradient(90deg,rgba(247,238,231,0.00)_0%,rgba(247,238,231,0.06)_37%,rgba(247,238,231,0.76)_59%,rgba(247,238,231,0.96)_74%,#f7eee7_100%)]
          "
        />

        {/* طبقة الهاتف لتحسين وضوح النص */}
        <div
          className="
            absolute inset-0 md:hidden
            bg-[linear-gradient(180deg,rgba(247,238,231,0.98)_0%,rgba(247,238,231,0.92)_42%,rgba(247,238,231,0.48)_70%,rgba(247,238,231,0.12)_100%)]
          "
        />

        <Container
          size="wide"
          className="
            relative z-10
            flex min-h-[520px] items-start
            py-9

            sm:min-h-[560px]
            sm:py-11

            md:min-h-[500px]
            md:items-center
            md:py-12

            lg:min-h-[540px]
            lg:py-14

            xl:min-h-[570px]
          "
        >
          {/* ml-auto يدفع الكتلة إلى يمين الشاشة */}
          <div
            className="
              w-full
              text-center

              md:ml-auto
              md:w-[45%]
              md:max-w-[620px]
              md:pr-4
              md:text-right

              lg:w-[43%]
              lg:pr-8

              xl:w-[42%]
              xl:max-w-[680px]
              xl:pr-10
            "
          >
            <div
              className="
                inline-flex items-center gap-2
                rounded-full
                border border-[#6b574a]/10
                bg-[#f4dfc9]/90
                px-4 py-2
                text-xs font-bold text-[#5b493e]
                shadow-sm
                backdrop-blur
              "
            >
              <ShieldCheck
                className="size-4 text-[#b88945]"
                aria-hidden="true"
              />

              منتجات بخور وعطور فاخرة
            </div>

            <div className="mt-6">
              <h1
                className="
                  font-display
                  text-5xl font-bold leading-[1.05]
                  text-[#5b493e]

                  sm:text-6xl

                  md:text-right

                  lg:text-7xl

                  xl:text-8xl
                "
              >
                {title}
              </h1>

              <div
                className="
                  mx-auto mt-5
                  flex max-w-md items-center gap-3

                  md:mx-0
                "
              >
                <span className="h-px flex-1 bg-[#c9944a]/45" />
                <span className="text-lg text-[#b88945]">✦</span>
                <span className="h-px flex-1 bg-[#c9944a]/45" />
              </div>

              <p
                className="
                  mx-auto mt-5 max-w-xl
                  text-base leading-8
                  text-[#6b574a]

                  sm:text-lg

                  md:mx-0
                  md:text-right

                  lg:text-xl
                  lg:leading-9
                "
              >
                {description}
              </p>
            </div>

            <div
              className="
                mt-8
                flex flex-col gap-3

                sm:flex-row
                sm:justify-center

                md:justify-start
              "
            >
              {primaryButtonLabel && primaryButtonHref ? (
                <Link
                  href={primaryButtonHref}
                  className="
                    inline-flex h-12
                    items-center justify-center

                    rounded-oud
                    border border-[#8a633b]
                    bg-[#6b452c]

                    px-8
                    text-sm font-bold
                    text-[#fffaf4]

                    shadow-[0_14px_28px_rgb(91_73_62_/_0.18)]

                    transition

                    hover:-translate-y-0.5
                    hover:bg-[#7a5134]
                  "
                >
                  {primaryButtonLabel}
                </Link>
              ) : null}

              <Link
                href="/#featured-categories"
                className="
                  inline-flex h-12
                  items-center justify-center gap-2

                  rounded-oud
                  border border-[#6b574a]/55
                  bg-[#fffaf4]/78

                  px-8
                  text-sm font-bold
                  text-[#5b493e]

                  backdrop-blur
                  transition

                  hover:-translate-y-0.5
                  hover:bg-[#fffaf4]
                "
              >
                اكتشف المجموعات
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* شريط المزايا */}
      <Container
        size="wide"
        className="
          relative z-20
          -mt-1 pb-5

          md:-mt-7
          md:pb-8
        "
      >
        <div
          className="
            grid gap-2

            rounded-[1.25rem]
            border border-[#d8b78e]/45
            bg-[#fffaf4]/94

            p-3

            shadow-[0_18px_45px_rgb(107_87_74_/_0.12)]
            backdrop-blur-xl

            md:grid-cols-3
            md:px-5
          "
        >
          {heroFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={[
                  "flex items-center justify-center gap-3 rounded-oud px-4 py-3",
                  index > 0
                    ? "border-t border-[#6b574a]/10 md:border-r md:border-t-0"
                    : ""
                ].join(" ")}
              >
                <span
                  className="
                    grid size-11 shrink-0
                    place-items-center

                    rounded-full
                    bg-[#f2dfca]
                    text-[#8a5b2e]
                  "
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>

                <span>
                  <span className="block text-sm font-bold text-[#4d3d34]">
                    {feature.title}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#78665a]">
                    {feature.description}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}