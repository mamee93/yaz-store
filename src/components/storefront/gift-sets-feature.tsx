import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { Badge, Container, Heading, Section } from "@/components/ui";

export function GiftSetsFeature() {
  return (
    <Section>
      <Container>
        <div className="grid overflow-hidden rounded-oud border border-oud-gold/25 bg-oud-brown shadow-gold md:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-72 bg-[radial-gradient(circle_at_35%_35%,rgba(215,181,118,0.28),transparent_30%),linear-gradient(145deg,rgba(87,55,36,1),rgba(35,28,24,1))] p-6">
            <div className="absolute bottom-8 right-8 h-40 w-40 rounded-oud border border-oud-gold/40 bg-oud-ivory/10 shadow-gold" />
            <div className="absolute bottom-20 right-20 h-32 w-32 rounded-oud border border-oud-gold/35 bg-oud-ivory/14 shadow-soft" />
            <div className="absolute left-8 top-8 grid size-14 place-items-center rounded-full border border-oud-gold/40 bg-oud-brown/35 text-oud-gold">
              <Gift className="size-6" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-5 p-6 text-oud-ivory md:p-10">
            <Badge variant="gold" className="bg-oud-gold/20">
              <Sparkles className="ms-1 size-3.5" aria-hidden="true" />
              هدايا فاخرة
            </Badge>
            <Heading
              tone="light"
              description="أطقم جاهزة للمناسبات، الزيارات، الأعياد، والهدايا الرسمية بتغليف يليق باللحظة."
            >
              أطقم هدايا بعناية عطرية
            </Heading>
            <Link
              href="/categories/gift-sets"
              className="inline-flex h-11 items-center justify-center rounded-oud bg-oud-ivory px-6 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige"
            >
              استكشف أطقم الهدايا
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
