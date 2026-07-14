import Link from "next/link";
import { Card, Container, Heading, Section } from "@/components/ui";

const policySections = [
  {
    title: "مدة طلب الاسترجاع أو الاستبدال",
    items: [
      "يمكن طلب الاسترجاع أو الاستبدال خلال 7 أيام من تاريخ اكتمال الطلب.",
      "يجب أن يكون المنتج بحالته الأصلية وغير مستخدم وبكامل تغليفه قدر الإمكان."
    ]
  },
  {
    title: "الحالات المقبولة",
    items: [
      "وصول منتج تالف أو مختلف عن الطلب.",
      "وجود مشكلة واضحة في الجودة بعد مراجعة فريق عود ياز.",
      "طلبات الاستبدال تخضع لتوفر المنتج البديل والمراجعة الإدارية."
    ]
  },
  {
    title: "طريقة احتساب مبلغ الاسترداد",
    items: [
      "يتم احتساب الاسترداد من قيمة المنتجات المرتجعة بعد الخصومات المطبقة على الطلب.",
      "رسوم التوصيل غير قابلة للاسترداد افتراضيًا.",
      "قد تعتمد إدارة المتجر استثناءً يشمل رسوم التوصيل في حالات محددة مثل الخطأ من المتجر أو تلف الشحنة."
    ]
  },
  {
    title: "المعالجة والاسترداد",
    items: [
      "بعد إرسال الطلب، تتم مراجعته من فريق الإدارة ثم يتم إبلاغ العميل بالحالة.",
      "يتم تسجيل الاسترداد بعد استلام المنتج المرتجع أو اعتماد الحالة المناسبة.",
      "قد تختلف مدة ظهور المبلغ حسب طريقة الاسترداد والجهة المالية المستخدمة."
    ]
  }
];

export default function ReturnsPolicyPage() {
  return (
    <main dir="rtl">
      <Section>
        <Container size="narrow" className="space-y-6">
          <Heading
            level={1}
            eyebrow="سياسة عود ياز"
            description="تفاصيل واضحة لطلبات الاسترجاع والاستبدال والاسترداد، بما في ذلك طريقة التعامل مع رسوم التوصيل."
          >
            سياسة الاسترجاع والاستبدال
          </Heading>

          <Card className="p-5 text-sm leading-8 text-oud-muted shadow-none sm:p-6">
            <p>
              نحرص في عود ياز على تجربة شراء واضحة وعادلة. يمكن للعميل طلب الاسترجاع أو الاستبدال عند توفر الشروط
              الموضحة أدناه، ويتم احتساب أي استرداد بناءً على قيمة المنتجات المرتجعة فقط ما لم تعتمد الإدارة استثناءً.
            </p>
          </Card>

          <div className="grid gap-4">
            {policySections.map((section) => (
              <Card key={section.title} className="p-5 shadow-none sm:p-6">
                <h2 className="font-display text-2xl font-bold text-oud-brown">{section.title}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-8 text-oud-muted">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-oud-gold" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <Card className="p-5 shadow-none sm:p-6">
            <h2 className="font-display text-2xl font-bold text-oud-brown">التواصل والمتابعة</h2>
            <p className="mt-3 text-sm leading-8 text-oud-muted">
              عند وجود منتج تالف أو خاطئ، يرجى التواصل معنا وإرفاق تفاصيل الطلب والصور الداعمة لتسريع المراجعة.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-oud bg-oud-brown px-5 text-sm font-semibold text-oud-ivory hover:bg-oud-coffee"
            >
              تواصل معنا
            </Link>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
