import { Container, Heading, Section } from "@/components/ui";

const faqs = [
  {
    question: "هل التوصيل متاح داخل عمان؟",
    answer: "نعم، نوفر تجربة طلب مناسبة لجميع محافظات عمان، وتظهر تفاصيل التوصيل أثناء إكمال الطلب."
  },
  {
    question: "كيف أختار العطر المناسب كهدية؟",
    answer: "يمكنك البدء من التصنيفات أو التواصل معنا عبر واتساب لنرشح لك خيارا مناسبا للمناسبة والميزانية."
  },
  {
    question: "هل المنتجات مناسبة للتغليف والهدايا؟",
    answer: "نعم، نركز على منتجات مختارة بعناية وتجربة عرض وتغليف تليق بالهدايا والمناسبات."
  },
  {
    question: "هل يمكنني الاستفسار قبل الطلب؟",
    answer: "نعم، قسم التواصل وواتساب مخصصان لمساعدتك قبل إتمام الطلب."
  }
];

export function HomeFaq() {
  return (
    <Section tone="beige" className="py-12 md:py-20">
      <Container className="space-y-8">
        <Heading
          eyebrow="الأسئلة الشائعة"
          description="إجابات سريعة تساعدك على اتخاذ قرار الشراء بثقة."
        >
          قبل أن تطلب
        </Heading>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-oud border border-oud-brown/10 bg-white p-5 shadow-soft"
            >
              <summary className="cursor-pointer list-none text-base font-bold text-oud-brown marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {faq.question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-oud-beige/40 text-oud-brown transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-8 text-oud-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
