import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container, Heading, Section } from "@/components/ui";

export type OfferPreview = {
  id?: string;
  title: string;
  description: string;
  href: string;
  tone: string;
};

type OffersPreviewProps = {
  offers: OfferPreview[];
};

export function OffersPreview({ offers }: OffersPreviewProps) {
  return (
    <Section className="py-12 md:py-20">
      <Container size="wide" className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Heading
            eyebrow="العروض الحالية"
            description="بنرات مختارة للعروض والمجموعات الموسمية، مصممة لتسهيل الوصول إلى أفضل الاختيارات."
          >
            عروض عود ياز
          </Heading>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-sm font-bold text-oud-brown underline decoration-oud-gold/50 underline-offset-8 hover:text-oud-gold"
          >
            كل العروض
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {offers.map((offer, index) => (
            <Link key={offer.id ?? `${offer.title}-${index}`} href={offer.href} className="group block">
              <article
                className="relative min-h-72 overflow-hidden rounded-oud border border-oud-brown/10 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-oud-gold/45 hover:shadow-gold"
                style={{ background: offer.tone }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(35_28_24_/_0.05),rgb(35_28_24_/_0.80))]" />
                <div className="absolute inset-x-0 bottom-0 space-y-4 p-5 text-oud-ivory">
                  <p className="text-xs font-bold text-oud-gold">عرض مختار</p>
                  <h3 className="font-display text-3xl font-bold leading-tight">{offer.title}</h3>
                  <p className="line-clamp-2 text-sm leading-7 text-oud-beige">{offer.description}</p>
                  <span className="inline-flex items-center gap-2 rounded-oud bg-oud-gold px-4 py-2 text-xs font-bold text-oud-brown transition group-hover:bg-oud-gold-soft">
                    عرض التفاصيل
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
