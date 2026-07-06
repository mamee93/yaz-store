import { Headphones, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui";

const trustItems = [
  { icon: ShieldCheck, title: "أصالة المنتجات", description: "اختيارات موثوقة بعناية" },
  { icon: Truck, title: "توصيل داخل عمان", description: "تجربة واضحة وسلسة" },
  { icon: PackageCheck, title: "تغليف فاخر", description: "جاهز للهدايا والمناسبات" },
  { icon: Headphones, title: "دعم واتساب", description: "استفسارات وطلبات بسرعة" }
];

export function TrustStrip() {
  return (
    <section className="bg-oud-brown py-7 text-oud-ivory">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-oud border border-oud-gold/35 bg-white/5 text-oud-gold">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold">{item.title}</span>
                  <span className="text-xs text-oud-beige">{item.description}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
