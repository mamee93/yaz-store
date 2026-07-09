"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Heart, PackageCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Badge, Card, Container, Heading, Price } from "@/components/ui";
import type { StoreProduct, StoreProductImage } from "./static-catalog";

type ProductDetailViewProps = {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
};

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  return (
    <main className="bg-oud-ivory">
      <Container size="wide" className="py-8 md:py-12">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <ProductGallery product={product} />

          <section className="min-w-0 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="gold">{product.categoryName}</Badge>
                {product.badge ? <Badge variant="soft">{product.badge}</Badge> : null}
                <Badge variant="success">{product.stockLabel}</Badge>
              </div>
              <Heading level={1} description={product.shortDescription}>
                {product.name}
              </Heading>
              <div className="flex flex-wrap items-end gap-3">
                <Price value={product.price} className="text-3xl" />
                {product.compareAtPrice ? (
                  <Price
                    value={product.compareAtPrice}
                    className="pb-1 text-base text-oud-muted line-through"
                  />
                ) : null}
              </div>
            </div>

            <Card className="space-y-5 bg-white p-5 shadow-none">
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailStat label="العائلة" value={product.label} />
                <DetailStat label="القوة" value={product.intensity} />
                <DetailStat label="الحجم" value={product.sizeLabel} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <AddToCartButton product={product} className="w-full" />
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-6 text-sm font-bold text-oud-brown transition hover:bg-oud-beige/40"
                >
                  <Heart className="size-4" aria-hidden="true" />
                  استفسر عن المنتج
                </Link>
              </div>
            </Card>

            <Card className="bg-white p-5 shadow-none">
              <h2 className="font-display text-2xl font-bold text-oud-brown">وصف المنتج</h2>
              <p className="mt-4 text-sm leading-8 text-oud-muted">{product.description}</p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeliveryCard
                icon={<Truck className="size-5" aria-hidden="true" />}
                title="معلومات التوصيل"
                description="توصيل داخل محافظات عمان، وتظهر تفاصيل الرسوم والخيارات أثناء إكمال الطلب."
              />
              <DeliveryCard
                icon={<PackageCheck className="size-5" aria-hidden="true" />}
                title="تغليف مناسب للهدايا"
                description="تجربة عرض راقية تناسب المناسبات والزيارات والهدايا الشخصية."
              />
            </div>
          </section>
        </div>

        <div className="mt-12 grid min-w-0 gap-4 lg:grid-cols-3">
          <InfoCard title="الطابع العطري" items={product.scentProfile} />
          <InfoCard title="طريقة الاستخدام" items={product.usage} />
          <InfoCard title="مناسب لـ" items={product.occasions} />
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-14 space-y-7">
            <Heading description="منتجات قريبة من نفس الذائقة أو التصنيف.">
              قد يعجبك أيضا
            </Heading>
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  className="group min-w-0 overflow-hidden rounded-oud border border-oud-brown/10 bg-white shadow-soft transition hover:-translate-y-1 hover:border-oud-gold/45 hover:shadow-gold"
                >
                  <RelatedProductImage product={item} />
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 min-h-12 break-words text-sm font-bold leading-6 text-oud-brown">
                      {item.name}
                    </p>
                    <Price value={item.price} className="text-sm" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}

function ProductGallery({ product }: { product: StoreProduct }) {
  const images = useMemo(() => getProductGalleryImages(product), [product]);
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];

  return (
    <section className="min-w-0 space-y-4">
      <div
        className="relative aspect-[4/5] min-h-[24rem] overflow-hidden rounded-oud border border-oud-gold/25 bg-oud-brown shadow-gold"
        style={{ background: product.imageTone }}
      >
        {selectedImage ? (
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-x-12 bottom-12 h-80 rounded-t-full border border-white/35 bg-white/15 shadow-soft backdrop-blur-sm" />
        )}
        <div className="absolute right-5 top-5 rounded-full border border-white/20 bg-oud-brown/40 px-4 py-2 text-xs font-bold text-oud-ivory backdrop-blur-sm">
          {selectedImage ? "صورة المنتج" : "معاينة المنتج"}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-1">
        {images.length > 0
          ? images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                className="relative aspect-square overflow-hidden rounded-oud border border-oud-brown/10 bg-white transition hover:border-oud-gold/45 data-[active=true]:border-oud-gold data-[active=true]:ring-2 data-[active=true]:ring-oud-gold/25"
                data-active={image.id === selectedImage?.id}
                aria-label={`عرض ${image.alt}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </button>
            ))
          : [1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="aspect-square rounded-oud border border-oud-brown/10"
                style={{ background: product.imageTone }}
              />
            ))}
      </div>
    </section>
  );
}

function RelatedProductImage({ product }: { product: StoreProduct }) {
  return (
    <div
      className="relative aspect-[3/4] overflow-hidden border-b border-oud-brown/10"
      style={{ background: product.imageTone }}
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.imageAlt ?? product.name}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}

function getProductGalleryImages(product: StoreProduct): StoreProductImage[] {
  if (product.images?.length) {
    return product.images;
  }

  if (product.imageUrl) {
    return [
      {
        id: `${product.slug}-primary`,
        url: product.imageUrl,
        alt: product.imageAlt ?? product.name,
        isPrimary: true
      }
    ];
  }

  return [];
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-oud border border-oud-brown/10 bg-oud-beige/25 p-3">
      <p className="text-xs text-oud-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-oud-brown">{value}</p>
    </div>
  );
}

function DeliveryCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="flex gap-3 bg-white p-4 shadow-none">
      <span className="grid size-11 shrink-0 place-items-center rounded-oud bg-oud-brown text-oud-gold">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-bold text-oud-brown">{title}</h2>
        <p className="mt-1 text-sm leading-7 text-oud-muted">{description}</p>
      </div>
    </Card>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-white p-5 shadow-none">
      <h2 className="font-display text-xl font-bold text-oud-brown">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-oud-muted">
            <CheckCircle2 className="size-4 shrink-0 text-oud-gold" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
