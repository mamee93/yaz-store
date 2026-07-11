import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Heading, Section } from "@/components/ui";

export type FeaturedCategory = {
  href: string;
  name: string;
  description: string;
  accent: string;
  imageUrl?: string;
};

type FeaturedCategoriesProps = {
  categories: FeaturedCategory[];
};

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <Section id="featured-categories" className="scroll-mt-24 py-12 md:py-20">
      <Container size="wide" className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Heading
            eyebrow="تسوق حسب التصنيف"
            description="ابدأ من العائلة العطرية الأقرب لذائقتك، من العود والبخور إلى العطور والهدايا."
          >
            تصنيفات عود ياز
          </Heading>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-oud-brown underline decoration-oud-gold/50 underline-offset-8 hover:text-oud-gold"
          >
            عرض كل المنتجات
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} className="group block">
              <article className="relative min-h-64 overflow-hidden rounded-oud border border-oud-brown/10 bg-oud-brown shadow-soft transition duration-300 hover:-translate-y-1 hover:border-oud-gold/45 hover:shadow-gold">
                <div className="absolute inset-0" style={{ background: category.accent }} />
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    unoptimized
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(35_28_24_/_0.05),rgb(35_28_24_/_0.78))]" />
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-oud-ivory">
                  <h3 className="font-display text-3xl font-bold leading-tight">{category.name}</h3>
                  <p className="line-clamp-2 text-sm leading-7 text-oud-beige">
                    {category.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-oud-gold">
                    استكشف التصنيف
                    <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
