import { PackageSearch } from "lucide-react";
import { trackOrderAction } from "@/features/order-tracking/actions";
import { Button, Card, Container, Heading, Input, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

type TrackOrderPageProps = {
  searchParams: Promise<{
    order?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const params = await searchParams;

  return (
    <main dir="rtl">
      <Section>
        <Container size="narrow" className="space-y-6">
          <Heading
            level={1}
            eyebrow="تتبع الطلب"
            description="أدخل رقم الطلب أو الفاتورة مع رقم الهاتف المستخدم في الطلب لعرض الحالة بأمان."
          >
            أين وصل طلبك؟
          </Heading>

          <Card className="p-5 shadow-none sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-oud bg-oud-brown text-oud-gold">
                <PackageSearch className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-bold text-oud-brown">تتبع آمن للطلب</h2>
                <p className="mt-1 text-sm leading-7 text-oud-muted">
                  فتح رابط QR يملأ رقم الطلب فقط، ويبقى رقم الهاتف مطلوبًا لحماية بياناتك.
                </p>
              </div>
            </div>

            {params.status === "error" && params.message ? (
              <div className="mb-4 rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900">
                {params.message}
              </div>
            ) : null}

            <form action={trackOrderAction} className="space-y-4">
              <Input
                name="identifier"
                label="رقم الطلب أو الفاتورة"
                defaultValue={params.order ?? ""}
                dir="ltr"
                required
                autoComplete="off"
              />
              <Input
                name="phone"
                label="رقم الهاتف"
                inputMode="tel"
                dir="ltr"
                required
                autoComplete="tel"
                placeholder="+968"
              />
              <Button type="submit" className="w-full sm:w-auto">
                تتبع الطلب
              </Button>
            </form>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
