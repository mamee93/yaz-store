import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, Container, Heading, Section } from "@/components/ui";

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
    <Section>
      <Container className="space-y-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Heading
            eyebrow="مختارات خاصة"
            description="عروض هادئة ومنتقاة دون ضجيج، مناسبة للتجربة الأولى أو للهدايا."
          >
            عروض عود ياز
          </Heading>
          <Link
            href="/offers"
            className="text-sm font-semibold text-oud-brown underline decoration-oud-gold/45 underline-offset-8 hover:text-oud-gold"
          >
            كل العروض
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {offers.map((offer, index) => (
            <Link key={offer.id ?? `${offer.title}-${index}`} href={offer.href} className="group">
              <Card className="overflow-hidden transition hover:-translate-y-1 hover:border-oud-gold/35 hover:shadow-gold">
                <div className="h-36 border-b border-oud-brown/10" style={{ background: offer.tone }} />
                <div className="space-y-3 p-5">
                  <h3 className="font-display text-2xl font-bold text-oud-brown">
                    {offer.title}
                  </h3>
                  <p className="text-sm leading-7 text-oud-muted">{offer.description}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-oud-gold">
                    عرض التفاصيل
                    <ArrowLeft className="size-4 transition group-hover:-translate-x-1" />
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
