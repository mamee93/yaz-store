import { CatalogToolbar } from "@/components/storefront/catalog-toolbar";
import { ProductGrid } from "@/components/storefront/product-grid";
import { storeProducts } from "@/components/storefront/static-catalog";
import { Container, Heading, Section } from "@/components/ui";
import { getActiveCategories, mapCategoryToStoreCategory } from "@/features/categories/queries";
import { getActiveProducts, mapProductToStoreProduct } from "@/features/products/queries";

export default async function ProductsPage() {
  const [categoryRows, productRows] = await Promise.all([
    getActiveCategories(),
    getActiveProducts()
  ]);
  const products =
    productRows.length > 0 ? productRows.map(mapProductToStoreProduct) : storeProducts;
  const categories =
    categoryRows.length > 0 ? categoryRows.map(mapCategoryToStoreCategory) : undefined;

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="المتجر"
            description="تصفح مختارات عود ياز من العود، البخور، العطور، المسك، وأطقم الهدايا."
          >
            جميع المنتجات
          </Heading>
          <CatalogToolbar resultCount={products.length} categories={categories} />
        </Container>
      </Section>

      <Section className="pt-2">
        <Container>
          <ProductGrid products={products} />
        </Container>
      </Section>
    </main>
  );
}
