import Link from "next/link";
import Image from "next/image";
import { Instagram, MessageCircle, Music2 } from "lucide-react";
import { Container } from "@/components/ui";
import { siteConfig } from "@/constants/site";

const categoryLinks = [
  { href: "/categories/oud", label: "العود" },
  { href: "/categories/bakhoor", label: "البخور" },
  { href: "/categories/perfumes", label: "العطور" },
  { href: "/categories/musk", label: "المسك" },
  { href: "/categories/gift-sets", label: "أطقم الهدايا" }
];

const supportLinks = [
  { href: "/delivery-returns", label: "التوصيل والاسترجاع" },
  { href: "/privacy-policy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/contact", label: "تواصل معنا" }
];

export function SiteFooter({
  storeName,
  description,
  logoUrl
}: {
  storeName?: string;
  description?: string | null;
  logoUrl?: string | null;
}) {
  const displayName = storeName ?? siteConfig.name;

  return (
    <footer className="mt-20 bg-oud-brown text-oud-ivory">
      <Container className="py-10 md:py-14">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          <div className="space-y-4">
            <Link href="/" className="inline-flex max-w-full items-center gap-3" aria-label={displayName}>
              <FooterLogoMark logoUrl={logoUrl} storeName={displayName} />
              <span className="min-w-0 truncate font-display text-2xl font-bold sm:text-3xl">
                {displayName}
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-7 text-oud-beige">
              {description ??
                "متجر عربي فاخر للعود والبخور والعطور والمسك وأطقم الهدايا، بتجربة هادئة تليق بذائقة عمان والخليج."}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/contact"
                aria-label="واتساب"
                className="grid size-10 place-items-center rounded-oud border border-white/10 text-oud-beige transition hover:border-oud-gold/45 hover:text-oud-gold"
              >
                <MessageCircle size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                aria-label="إنستغرام"
                className="grid size-10 place-items-center rounded-oud border border-white/10 text-oud-beige transition hover:border-oud-gold/45 hover:text-oud-gold"
              >
                <Instagram size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                aria-label="تيك توك"
                className="grid size-10 place-items-center rounded-oud border border-white/10 text-oud-beige transition hover:border-oud-gold/45 hover:text-oud-gold"
              >
                <Music2 size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <FooterGroup title="التصنيفات" links={categoryLinks} />
          <FooterGroup title="الدعم والسياسات" links={supportLinks} />

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">التواصل</p>
            <div className="space-y-3 text-sm leading-7 text-oud-beige">
              <p>الدعم عبر واتساب متاح للطلبات والاستفسارات.</p>
              <Link href="/contact" className="inline-flex font-semibold text-oud-gold">
                تواصل معنا
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-oud-beige">
          <p>© {new Date().getFullYear()} {displayName}. جميع الحقوق محفوظة.</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterLogoMark({
  logoUrl,
  storeName
}: {
  logoUrl?: string | null;
  storeName: string;
}) {
  if (logoUrl) {
    return (
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-oud border border-oud-gold/45 bg-oud-ivory">
        <Image
          src={logoUrl}
          alt={`${storeName} logo`}
          width={44}
          height={44}
          unoptimized
          className="h-full w-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-oud border border-oud-gold/45 bg-oud-coffee font-display text-lg font-bold text-oud-gold">
      ع
    </span>
  );
}

function FooterGroup({
  title,
  links
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <nav className="space-y-3 text-sm text-oud-beige" aria-label={title}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="block transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
