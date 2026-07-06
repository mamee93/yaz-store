import { ProductDetailView } from "@/components/storefront/product-detail-view";
import { getProductBySlug, storeProducts } from "@/components/storefront/static-catalog";
import {
  getActiveProductBySlug,
  getActiveProducts,
  mapProductToStoreProduct
} from "@/features/products/queries";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [productRow, productRows] = await Promise.all([
    getActiveProductBySlug(slug),
    getActiveProducts()
  ]);
  const product = productRow ? mapProductToStoreProduct(productRow) : getProductBySlug(slug);
  const products =
    productRows.length > 0 ? productRows.map(mapProductToStoreProduct) : storeProducts;
  const relatedProducts = products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 4);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
