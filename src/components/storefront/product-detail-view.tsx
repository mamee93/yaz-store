"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Heart, PackageCheck, Truck } from "lucide-react";
import { Badge, Card, Container, Heading, Price } from "@/components/ui";
import { AddToCartButton } from "./add-to-cart-button";
import type { StoreProduct, StoreProductImage } from "./static-catalog";

type ProductDetailViewProps = {
  product: StoreProduct;
  relatedProducts: StoreProduct[];
};

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  return (
    <main>
      <Container className="py-8 md:py-12">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
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
                <Price value={product.price} className="text-2xl" />
                {product.compareAtPrice ? (
                  <Price
                    value={product.compareAtPrice}
                    className="pb-1 text-sm text-oud-muted line-through"
                  />
                ) : null}
              </div>
            </div>

            <Card className="space-y-4 p-4 sm:p-5">
              <p className="text-sm leading-8 text-oud-muted">{product.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStat label="القوة" value={product.intensity} />
                <DetailStat label="المخزون" value={product.stockLabel} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <AddToCartButton product={product} className="w-full" />
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-7 text-sm font-semibold text-oud-brown transition hover:bg-oud-beige/40"
                >
                  <Heart className="size-4" aria-hidden="true" />
                  استفسر عن المنتج
                </Link>
              </div>
            </Card>
          </section>
        </div>

        <div className="mt-10 grid min-w-0 gap-4 lg:grid-cols-3">
          <InfoCard title="الطابع العطري" items={product.scentProfile} />
          <InfoCard title="طريقة الاستخدام" items={product.usage} />
          <InfoCard title="مناسب لـ" items={product.occasions} />
        </div>

        <Card className="mt-6 grid gap-4 p-4 sm:p-5 md:grid-cols-2">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">
              <Truck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-oud-brown">ملاحظة التوصيل</h2>
              <p className="mt-1 text-sm leading-7 text-oud-muted">
                التوصيل داخل عمان والخليج سيظهر بتفاصيله عند ربط إعدادات المتجر لاحقاً.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-oud bg-oud-beige/45 text-oud-brown">
              <PackageCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-oud-brown">تغليف فاخر</h2>
              <p className="mt-1 text-sm leading-7 text-oud-muted">
                المنتجات مؤهلة لتجربة تغليف فاخرة مناسبة للهدايا والمناسبات.
              </p>
            </div>
          </div>
        </Card>

        <section className="mt-12 space-y-6">
          <Heading description="منتجات قريبة من نفس الذائقة أو التصنيف.">
            قد يعجبك أيضاً
          </Heading>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-3 md:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link
                key={item.slug}
                href={`/products/${item.slug}`}
                className="min-w-0 rounded-oud border border-oud-brown/10 bg-oud-pearl p-3 transition hover:border-oud-gold/35 sm:p-4"
              >
                <RelatedProductImage product={item} />
                <p className="break-words text-sm font-bold text-oud-brown">{item.name}</p>
                <Price value={item.price} className="mt-2 text-sm" />
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}

function ProductGallery({ product }: { product: StoreProduct }) {
  const images = useMemo(() => getProductGalleryImages(product), [product]);
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];

  return (
    <section className="min-w-0 space-y-3">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-oud border border-oud-gold/25 shadow-gold"
        style={{ background: product.imageTone }}
      >
        {selectedImage ? (
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <>
            <div className="absolute bottom-10 left-1/2 h-72 w-32 -translate-x-1/2 rounded-t-full border border-white/40 bg-white/18 shadow-soft backdrop-blur-sm" />
            <div className="absolute bottom-10 left-1/2 h-16 w-52 -translate-x-1/2 rounded-full bg-oud-brown/20 blur-lg" />
          </>
        )}
        <div className="absolute right-5 top-5 rounded-full border border-white/20 bg-oud-brown/25 px-4 py-2 text-xs font-semibold text-oud-ivory">
          {selectedImage ? "صورة المنتج" : "صورة تجريبية"}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-1">
        {images.length > 0
          ? images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                className="relative aspect-square overflow-hidden rounded-oud border border-oud-brown/10 transition hover:border-oud-gold/45 data-[active=true]:border-oud-gold data-[active=true]:ring-2 data-[active=true]:ring-oud-gold/25"
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
      className="relative mb-3 aspect-square overflow-hidden rounded-oud"
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

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-5">
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
