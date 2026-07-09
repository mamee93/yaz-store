import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Instagram, Mail, MessageCircle, Music2, Phone } from "lucide-react";
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
      <Container size="wide" className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-5">
            <Link href="/" className="inline-flex max-w-full items-center gap-3" aria-label={displayName}>
              <FooterLogoMark logoUrl={logoUrl} storeName={displayName} />
              <span className="min-w-0 truncate font-display text-3xl font-bold">
                {displayName}
              </span>
            </Link>
            <p className="max-w-md text-sm leading-8 text-oud-beige">
              {description ??
                "متجر عربي فاخر للعود والبخور والعطور والمسك وأطقم الهدايا، بتجربة شراء هادئة وواضحة تناسب ذائقة عمان والخليج."}
            </p>
            <div className="flex items-center gap-2">
              <SocialLink href="/contact" label="واتساب" icon={<MessageCircle size={18} aria-hidden="true" />} />
              <SocialLink href="/contact" label="إنستغرام" icon={<Instagram size={18} aria-hidden="true" />} />
              <SocialLink href="/contact" label="تيك توك" icon={<Music2 size={18} aria-hidden="true" />} />
            </div>
          </div>

          <FooterGroup title="التصنيفات" links={categoryLinks} />
          <FooterGroup title="الدعم والسياسات" links={supportLinks} />

          <div className="space-y-4">
            <p className="text-sm font-bold text-white">معلومات التواصل</p>
            <div className="space-y-3 text-sm leading-7 text-oud-beige">
              <FooterContact icon={<MessageCircle className="size-4" aria-hidden="true" />}>
                دعم سريع عبر واتساب للطلبات والاستفسارات.
              </FooterContact>
              <FooterContact icon={<Phone className="size-4" aria-hidden="true" />}>
                خدمة عملاء لمساعدتك في اختيار المنتج المناسب.
              </FooterContact>
              <FooterContact icon={<Mail className="size-4" aria-hidden="true" />}>
                تابع صفحة التواصل للحصول على أحدث معلومات الاتصال.
              </FooterContact>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-oud-beige sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {displayName}. جميع الحقوق محفوظة.</p>
          <p>تجربة عطور عربية فاخرة من عمان إلى الخليج.</p>
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
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-oud border border-oud-gold/45 bg-oud-ivory">
        <Image
          src={logoUrl}
          alt={`${storeName} logo`}
          width={48}
          height={48}
          unoptimized
          className="h-full w-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-oud border border-oud-gold/45 bg-oud-coffee font-display text-xl font-bold text-oud-gold">
      ع
    </span>
  );
}

function SocialLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-10 place-items-center rounded-oud border border-white/10 text-oud-beige transition hover:border-oud-gold/45 hover:text-oud-gold"
    >
      {icon}
    </Link>
  );
}

function FooterContact({
  icon,
  children
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <p className="flex gap-2">
      <span className="mt-1 text-oud-gold">{icon}</span>
      <span>{children}</span>
    </p>
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
      <p className="text-sm font-bold text-white">{title}</p>
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
