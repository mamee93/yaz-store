import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge, Container } from "@/components/ui";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-oud-ivory">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-oud-beige/45 to-transparent" />
      <Container className="relative grid min-h-[calc(100svh-4rem)] items-center gap-8 py-8 sm:py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:py-14">
        <div className="space-y-6">
          <Badge variant="gold" className="gap-2">
            <Sparkles className="size-3.5" aria-hidden="true" />
            مختارات عطرية لعمان والخليج
          </Badge>

          <div className="space-y-5">
            <h1 className="text-pretty font-display text-3xl font-bold leading-tight text-oud-brown sm:text-4xl md:text-6xl">
              فخامة العود والبخور بروح عربية هادئة
            </h1>
            <p className="max-w-xl text-sm leading-7 text-oud-muted sm:text-base sm:leading-8 md:text-lg">
              عود ياز يقدم عوداً، بخوراً، عطورا، مسكاً، وأطقم هدايا مختارة بعناية
              لتجربة فاخرة من أول نظرة حتى لحظة التغليف.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-oud bg-oud-brown px-7 text-sm font-semibold text-oud-ivory shadow-soft transition hover:bg-oud-coffee"
            >
              تسوق الآن
            </Link>
            <Link
              href="/offers"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-7 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/40"
            >
              العروض المختارة
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="rounded-oud border border-oud-gold/25 bg-gradient-to-br from-oud-brown via-oud-coffee to-oud-gold p-4 shadow-gold">
            <div className="relative min-h-[20rem] overflow-hidden rounded-oud border border-white/15 bg-[radial-gradient(circle_at_35%_25%,rgba(255,252,246,0.22),transparent_28%),linear-gradient(145deg,rgba(54,31,20,0.1),rgba(54,31,20,0.55))] p-5 sm:min-h-[24rem] sm:p-6 md:min-h-[28rem]">
              <div className="absolute bottom-8 left-7 h-64 w-24 rounded-t-full border border-oud-gold/40 bg-oud-ivory/12 shadow-gold backdrop-blur-sm" />
              <div className="absolute bottom-8 left-24 h-80 w-32 rounded-t-[4rem] border border-oud-gold/45 bg-oud-ivory/16 shadow-gold backdrop-blur-sm" />
              <div className="absolute bottom-8 right-8 h-44 w-28 rounded-oud border border-oud-gold/35 bg-oud-brown/35 shadow-soft" />
              <div className="absolute right-7 top-7 rounded-full border border-oud-gold/30 bg-oud-brown/25 px-4 py-2 text-xs font-semibold text-oud-beige">
                تغليف فاخر
              </div>
              <div className="absolute bottom-7 right-7 max-w-56 space-y-3 text-oud-ivory">
                <p className="font-display text-3xl font-bold">Oud Yaz</p>
                <p className="text-sm leading-7 text-oud-beige">
                  مساحة بصرية فاخرة لمنتجات العود والبخور والهدايا.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
