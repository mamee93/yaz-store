import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Badge, Card, Container, Heading, Price, Section } from "@/components/ui";

export type ProductPreview = {
  name: string;
  href: string;
  price: number;
  label: string;
  imageTone: string;
  imageUrl?: string;
  imageAlt?: string;
  badge?: string;
};

type ProductPreviewSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: ProductPreview[];
  href: string;
  tone?: "default" | "beige";
};

export function ProductPreviewSection({
  eyebrow,
  title,
  description,
  products,
  href,
  tone = "default"
}: ProductPreviewSectionProps) {
  return (
    <Section tone={tone} className="py-12 md:py-20">
      <Container size="wide" className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Heading eyebrow={eyebrow} description={description}>
            {title}
          </Heading>
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-bold text-oud-brown underline decoration-oud-gold/50 underline-offset-8 hover:text-oud-gold"
          >
            عرض الكل
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {products.map((product) => (
            <ProductPreviewCard key={product.href} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

function ProductPreviewCard({ product }: { product: ProductPreview }) {
  return (
    <Link href={product.href} className="group block h-full">
      <Card className="h-full overflow-hidden bg-white transition duration-300 hover:-translate-y-1 hover:border-oud-gold/45 hover:shadow-gold">
        <div
          className="relative aspect-[3/4] overflow-hidden border-b border-oud-brown/10"
          style={{ background: product.imageTone }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-x-8 bottom-8 h-44 rounded-t-full border border-white/35 bg-white/15 shadow-soft backdrop-blur-sm" />
          )}
          {product.badge ? (
            <Badge variant="gold" className="absolute right-3 top-3">
              {product.badge}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-3 p-4">
          <p className="text-xs font-bold text-oud-gold">{product.label}</p>
          <h3 className="line-clamp-2 min-h-12 break-words text-sm font-bold leading-6 text-oud-brown sm:text-base">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <Price value={product.price} className="text-base" />
            <span className="inline-flex size-10 items-center justify-center rounded-oud bg-oud-brown text-oud-ivory transition group-hover:bg-oud-gold group-hover:text-oud-brown">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
