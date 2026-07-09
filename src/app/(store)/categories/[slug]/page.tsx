import Link from "next/link";
import Image from "next/image";
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
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <Heading level={1} eyebrow="تصنيف" description={category.description}>
              {category.name}
            </Heading>
            <div
              className="relative min-h-44 overflow-hidden rounded-oud border border-oud-gold/25 shadow-soft"
              style={{ background: category.imageTone }}
              aria-hidden="true"
            >
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 45vw, 100vw"
                  className="object-cover"
                  unoptimized
                />
              ) : null}
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
        <Container className="space-y-10">
          <ProductGrid products={products} />

          <Card className="p-5">
            <h2 className="font-display text-2xl font-bold text-oud-brown">
              تصنيفات أخرى
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories
                .filter((item) => item.slug !== category.slug)
                .slice(0, 4)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={`/categories/${item.slug}`}
                    className="flex items-center justify-between rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 text-sm font-semibold text-oud-brown transition hover:border-oud-gold/35"
                  >
                    {item.name}
                    <ArrowLeft className="size-4 text-oud-gold" aria-hidden="true" />
                  </Link>
                ))}
            </div>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
