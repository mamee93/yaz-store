import { Search } from "lucide-react";
import { ProductGrid } from "@/components/storefront/product-grid";
import { storeProducts } from "@/components/storefront/static-catalog";
import { Badge, Container, EmptyState, Heading, Input, Section } from "@/components/ui";

export default function SearchPage() {
  const suggestedProducts = storeProducts.slice(0, 4);
  const popularSearches = ["عود", "بخور", "مسك", "هدايا", "عطر شرقي"];

  return (
    <main>
      <Section className="pb-6">
        <Container className="space-y-7">
          <Heading
            level={1}
            eyebrow="البحث"
            description="ابحث عن العود، البخور، العطور، أو الهدايا. البحث هنا واجهة ثابتة وسيتم ربطه لاحقاً."
          >
            البحث في عود ياز
          </Heading>

          <div className="rounded-oud border border-oud-brown/10 bg-oud-pearl p-4 shadow-soft">
            <div className="relative">
              <Input
                label="كلمة البحث"
                name="search"
                placeholder="مثال: دهن عود، بخور، هدية"
                className="pe-11"
              />
              <Search
                className="absolute left-3 top-[2.65rem] size-5 text-oud-muted"
                aria-hidden="true"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <Badge key={item} variant="soft">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-2">
        <Container className="space-y-10">
          <div className="space-y-5">
            <Heading level={2} description="نتائج افتراضية لعرض شكل صفحة البحث.">
              نتائج مقترحة
            </Heading>
            <ProductGrid products={suggestedProducts} />
          </div>

          <EmptyState
            title="لا توجد نتائج بعد"
            description="عند ربط البحث لاحقاً، ستظهر هنا رسالة فارغة عند عدم العثور على منتجات مطابقة."
            icon={<Search className="size-5" aria-hidden="true" />}
          />
        </Container>
      </Section>
    </main>
  );
}
