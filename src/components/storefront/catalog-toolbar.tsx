import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui";
import { storeCategories, type StoreCategory } from "./static-catalog";

type CatalogToolbarProps = {
  activeCategorySlug?: string;
  resultCount: number;
  categories?: StoreCategory[];
};

export function CatalogToolbar({
  activeCategorySlug,
  resultCount,
  categories = storeCategories
}: CatalogToolbarProps) {
  return (
    <Card className="bg-white p-4 shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-oud-brown">
          <SlidersHorizontal className="size-4 text-oud-gold" aria-hidden="true" />
          <span>{resultCount} منتج</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/products"
            className="shrink-0 rounded-full border border-oud-brown/10 bg-oud-pearl px-4 py-2 text-xs font-bold text-oud-muted transition hover:text-oud-brown"
          >
            الكل
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className={
                activeCategorySlug === category.slug
                  ? "shrink-0 rounded-full border border-oud-gold/45 bg-oud-gold/15 px-4 py-2 text-xs font-bold text-oud-brown"
                  : "shrink-0 rounded-full border border-oud-brown/10 bg-oud-pearl px-4 py-2 text-xs font-bold text-oud-muted transition hover:text-oud-brown"
              }
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
