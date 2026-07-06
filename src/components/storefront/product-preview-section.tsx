import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
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
    <Section tone={tone}>
      <Container className="space-y-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Heading eyebrow={eyebrow} description={description}>
            {title}
          </Heading>
          <Link
            href={href}
            className="text-sm font-semibold text-oud-brown underline decoration-oud-gold/45 underline-offset-8 hover:text-oud-gold"
          >
            عرض الكل
          </Link>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-3 md:grid-cols-4">
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
    <Link href={product.href} className="group">
      <Card className="h-full overflow-hidden transition hover:-translate-y-1 hover:border-oud-gold/35 hover:shadow-gold">
        <div
          className="relative aspect-[4/5] border-b border-oud-brown/10"
          style={{ background: product.imageTone }}
        >
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          ) : null}
          {product.badge ? (
            <Badge variant="gold" className="absolute right-3 top-3">
              {product.badge}
            </Badge>
          ) : null}
          {!product.imageUrl ? (
            <>
              <div className="absolute bottom-5 left-1/2 h-28 w-16 -translate-x-1/2 rounded-t-full border border-white/35 bg-white/18 shadow-soft backdrop-blur-sm" />
              <div className="absolute bottom-5 left-1/2 h-10 w-24 -translate-x-1/2 rounded-full bg-oud-brown/18 blur-md" />
            </>
          ) : null}
        </div>
        <div className="space-y-2 p-3 md:p-4">
          <p className="text-xs font-semibold text-oud-gold">{product.label}</p>
          <h3 className="line-clamp-2 min-h-12 break-words text-sm font-bold leading-6 text-oud-brown">
            {product.name}
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Price value={product.price} className="text-sm" />
            <span className="inline-flex size-9 items-center justify-center rounded-oud bg-oud-brown text-oud-ivory transition group-hover:bg-oud-gold group-hover:text-oud-brown">
              <ShoppingBag className="size-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
