import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, Container, Heading, Section } from "@/components/ui";

export type FeaturedCategory = {
  href: string;
  name: string;
  description: string;
  accent: string;
};

type FeaturedCategoriesProps = {
  categories: FeaturedCategory[];
};

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <Section>
      <Container className="space-y-7">
        <Heading
          eyebrow="تسوق حسب التصنيف"
          description="ابدأ من النوع الأقرب لذائقتك، من العود اليومي إلى هدايا المناسبات."
        >
          تصنيفات مختارة
        </Heading>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.href} href={category.href} className="group">
              <Card className="h-full overflow-hidden p-4 transition hover:-translate-y-1 hover:border-oud-gold/35 hover:shadow-gold">
                <div
                  className="mb-4 h-24 rounded-oud border border-oud-brown/10"
                  style={{ background: category.accent }}
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-oud-brown">
                    {category.name}
                  </h3>
                  <p className="min-h-12 text-xs leading-6 text-oud-muted">
                    {category.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-oud-gold">
                    استكشف
                    <ArrowLeft className="size-3.5 transition group-hover:-translate-x-1" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
