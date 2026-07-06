import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { OfferCard } from "@/components/storefront/offer-card";
import { ProductGrid } from "@/components/storefront/product-grid";
import { storeOffers, storeProducts } from "@/components/storefront/static-catalog";
import { Badge, Container, Heading, Section } from "@/components/ui";

export default function OffersPage() {
  const offerProducts = storeProducts.filter((product) => product.badge || product.compareAtPrice);

  return (
    <main>
      <Section className="pb-6">
        <Container>
          <div className="grid overflow-hidden rounded-oud border border-oud-gold/25 bg-oud-brown shadow-gold md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 p-6 text-oud-ivory md:p-10">
              <Badge variant="gold" className="bg-oud-gold/20">
                <Sparkles className="ms-1 size-3.5" aria-hidden="true" />
                مختارات خاصة
              </Badge>
              <Heading
                level={1}
                tone="light"
                description="عروض راقية ومنتقاة دون ازدحام، مناسبة للتجربة الأولى والهدايا."
              >
                عروض عود ياز
              </Heading>
              <Link
                href="/products"
                className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-ivory px-6 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige"
              >
                تصفح المنتجات
              </Link>
            </div>
            <div className="relative min-h-64 bg-[radial-gradient(circle_at_35%_35%,rgba(215,181,118,0.28),transparent_30%),linear-gradient(145deg,rgba(87,55,36,1),rgba(35,28,24,1))]">
              <div className="absolute bottom-8 right-8 h-36 w-36 rounded-oud border border-oud-gold/40 bg-oud-ivory/10 shadow-gold" />
              <div className="absolute left-8 top-8 grid size-14 place-items-center rounded-full border border-oud-gold/40 bg-oud-brown/35 text-oud-gold">
                <Gift className="size-6" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-4">
        <Container className="space-y-7">
          <Heading description="بطاقات عروض ثابتة حالياً، وسيتم ربطها لاحقاً بجدول البنرات أو العروض.">
            العروض الحالية
          </Heading>
          <div className="grid gap-4 md:grid-cols-3">
            {storeOffers.map((offer) => (
              <OfferCard key={offer.title} offer={offer} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="beige">
        <Container className="space-y-7">
          <Heading
            eyebrow="منتجات ضمن العروض"
            description="منتجات تجريبية عليها وسم أو سعر قبل الخصم لعرض الشكل العام."
          >
            مختارات بسعر خاص
          </Heading>
          <ProductGrid products={offerProducts} />
        </Container>
      </Section>
    </main>
  );
}
