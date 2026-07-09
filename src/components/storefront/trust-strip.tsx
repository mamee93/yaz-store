import { Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Card, Container, Heading, Section } from "@/components/ui";

const trustItems = [
  {
    icon: Truck,
    title: "توصيل لجميع محافظات عمان",
    description: "تجربة طلب واضحة من اختيار المنتج حتى استلامه."
  },
  {
    icon: PackageCheck,
    title: "منتجات مختارة بعناية",
    description: "تشكيلة مركزة تناسب الهدايا والاستخدام اليومي."
  },
  {
    icon: Headphones,
    title: "خدمة عملاء سريعة",
    description: "مساعدة مباشرة قبل الطلب وبعده عبر قنوات التواصل."
  },
  {
    icon: ShieldCheck,
    title: "جودة مضمونة",
    description: "اهتمام بالتفاصيل في المنتج والتغليف وتجربة الشراء."
  }
];

export function TrustStrip() {
  return (
    <Section tone="beige" className="py-12 md:py-20">
      <Container size="wide" className="space-y-8">
        <Heading
          eyebrow="لماذا عود ياز؟"
          description="تجربة عطور فاخرة توازن بين الذوق الخليجي وسهولة الشراء من الجوال."
        >
          ثقة ووضوح في كل طلب
        </Heading>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="bg-white p-5 shadow-none">
                <span className="grid size-12 place-items-center rounded-oud bg-oud-brown text-oud-gold">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-base font-bold text-oud-brown">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-oud-muted">{item.description}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
