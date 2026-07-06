import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { StoreOffer } from "./static-catalog";

type OfferCardProps = {
  offer: StoreOffer;
};

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <Link href={offer.href} className="group block h-full">
      <Card className="h-full overflow-hidden transition hover:-translate-y-1 hover:border-oud-gold/35 hover:shadow-gold">
        <div className="relative h-44 border-b border-oud-brown/10" style={{ background: offer.tone }}>
          <Badge variant="gold" className="absolute right-4 top-4">
            {offer.label}
          </Badge>
          <div className="absolute bottom-5 left-6 h-24 w-24 rounded-oud border border-white/25 bg-white/10 shadow-soft" />
        </div>
        <div className="space-y-3 p-5">
          <h2 className="font-display text-2xl font-bold text-oud-brown">{offer.title}</h2>
          <p className="text-sm leading-7 text-oud-muted">{offer.description}</p>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-oud-gold">
            اكتشف العرض
            <ArrowLeft className="size-4 transition group-hover:-translate-x-1" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
