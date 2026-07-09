import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui";

export function WhatsAppCta() {
  return (
    <section className="py-12 md:py-20">
      <Container size="wide">
        <div className="overflow-hidden rounded-oud border border-oud-gold/30 bg-oud-brown text-oud-ivory shadow-gold">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-bold text-oud-gold">مساعدة شخصية</p>
              <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                محتار بين العود والبخور والعطور؟
              </h2>
              <p className="text-sm leading-8 text-oud-beige sm:text-base">
                تواصل معنا لنرشح لك الاختيار الأنسب حسب المناسبة، الذائقة، والميزانية.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-oud bg-oud-gold px-7 text-sm font-bold text-oud-brown transition hover:bg-oud-gold-soft"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              تواصل عبر واتساب
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
