import Link from "next/link";
import { Container, Heading, Section } from "@/components/ui";

type BrandStoryPreviewProps = {
  story?: string | null;
};

export function BrandStoryPreview({ story }: BrandStoryPreviewProps) {
  return (
    <Section tone="beige">
      <Container>
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div className="min-h-72 rounded-oud border border-oud-gold/25 bg-[radial-gradient(circle_at_50%_20%,rgba(184,137,69,0.22),transparent_28%),linear-gradient(145deg,rgba(250,246,238,1),rgba(226,211,188,1))] p-5 shadow-soft">
            <div className="flex h-full min-h-64 items-end rounded-oud border border-white/70 p-5">
              <p className="font-display text-3xl font-bold text-oud-brown">عود ياز</p>
            </div>
          </div>

          <div className="space-y-5">
            <Heading
              eyebrow="قصة العلامة"
              description="نؤمن أن الفخامة الحقيقية هادئة؛ تظهر في جودة الاختيار، رقي التغليف، ووضوح التجربة."
            >
              تجربة عربية بنَفَس عماني وخليجي
            </Heading>
            <p className="max-w-2xl text-sm leading-8 text-oud-muted md:text-base">
              {story ??
                "عود ياز ليس مجرد متجر عطور، بل مساحة لاختيار روائح تليق بالمجالس، المناسبات، والهدايا التي تبقى في الذاكرة."}
            </p>
            <Link
              href="/about"
              className="inline-flex h-11 items-center justify-center rounded-oud border border-oud-brown/20 bg-oud-pearl px-6 text-sm font-semibold text-oud-brown transition hover:bg-oud-ivory"
            >
              اقرأ عن عود ياز
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
