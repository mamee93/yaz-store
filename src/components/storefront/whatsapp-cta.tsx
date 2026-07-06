import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui";

export function WhatsAppCta() {
  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="rounded-oud border border-oud-gold/25 bg-oud-brown p-6 text-oud-ivory shadow-gold md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="font-display text-2xl font-bold md:text-3xl">تحتاج مساعدة في الاختيار؟</p>
              <p className="max-w-2xl text-sm leading-7 text-oud-beige">
                تواصل معنا لاختيار العطر أو الهدية الأنسب للمناسبة والذائقة.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-oud bg-oud-gold px-7 text-sm font-semibold text-oud-brown transition hover:bg-oud-gold-soft"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              تواصل عبر واتساب
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
