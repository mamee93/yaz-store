import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CatalogToolbar } from "@/components/storefront/catalog-toolbar";
import { ProductGrid } from "@/components/storefront/product-grid";
import {
  getCategoryBySlug,
  getProductsByCategory,
  storeCategories
} from "@/components/storefront/static-catalog";
import { Card, Container, Heading, Section } from "@/components/ui";
import {
  getActiveCategories,
  getActiveCategoryBySlug,
  mapCategoryToStoreCategory
} from "@/features/categories/queries";
import {
  getActiveProductsByCategorySlug,
  mapProductToStoreProduct
} from "@/features/products/queries";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [categoryRow, categoryRows, productRows] = await Promise.all([
    getActiveCategoryBySlug(slug),
    getActiveCategories(),
    getActiveProductsByCategorySlug(slug)
  ]);
  const category = categoryRow ? mapCategoryToStoreCategory(categoryRow) : getCategoryBySlug(slug);
  const categories =
    categoryRows.length > 0 ? categoryRows.map(mapCategoryToStoreCategory) : storeCategories;
  const products =
    productRows.length > 0
      ? productRows.map(mapProductToStoreProduct)
      : getProductsByCategory(category.slug);

  return (
    <main className="bg-oud-ivory">
      <Section className="pb-8 pt-8 md:pb-10 md:pt-12">
        <Container size="wide" className="space-y-7">
          <div className="relative min-h-[24rem] overflow-hidden rounded-oud border border-oud-gold/25 bg-oud-brown shadow-gold">
            <div className="absolute inset-0" style={{ background: category.imageTone }} />
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                unoptimized
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(35_28_24_/_0.82),rgb(35_28_24_/_0.34))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-oud-ivory sm:p-8 lg:p-10">
              <Heading
                level={1}
                eyebrow="تصنيف"
                description={category.description}
                tone="light"
                className="max-w-3xl"
              >
                {category.name}
              </Heading>
              <p className="mt-5 inline-flex rounded-full border border-oud-gold/35 bg-oud-brown/45 px-4 py-2 text-xs font-bold text-oud-beige backdrop-blur-sm">
                {products.length} منتج متاح
              </p>
            </div>
          </div>

          <CatalogToolbar
            activeCategorySlug={category.slug}
            resultCount={products.length}
            categories={categories}
          />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container size="wide" className="space-y-12">
          <ProductGrid products={products} />

          <Card className="bg-white p-5 shadow-none md:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold text-oud-gold">استكشف المزيد</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-oud-brown">
                  تصنيفات أخرى
                </h2>
              </div>
              <Link href="/products" className="text-sm font-bold text-oud-gold">
                كل المنتجات
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories
                .filter((item) => item.slug !== category.slug)
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={`/categories/${item.slug}`}
                    className="group flex items-center justify-between rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 text-sm font-bold text-oud-brown transition hover:border-oud-gold/45 hover:bg-oud-beige/25"
                  >
                    {item.name}
                    <ArrowLeft className="size-4 text-oud-gold transition group-hover:-translate-x-1" aria-hidden="true" />
                  </Link>
                ))}
            </div>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
