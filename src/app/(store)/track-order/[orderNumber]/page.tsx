import { notFound } from "next/navigation";
import { OrderTrackingResult } from "@/components/storefront/order-tracking-result";
import { Container, EmptyState, Section } from "@/components/ui";
import { getTrackableOrderByToken } from "@/features/order-tracking/queries";
import { getStoreSettings } from "@/features/store-settings/queries";

export const dynamic = "force-dynamic";

type TrackOrderResultPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
  searchParams: Promise<{
    t?: string;
  }>;
};

export default async function TrackOrderResultPage({
  params,
  searchParams
}: TrackOrderResultPageProps) {
  const [{ orderNumber }, query, settings] = await Promise.all([
    params,
    searchParams,
    getStoreSettings()
  ]);
  const order = await getTrackableOrderByToken(query.t);

  if (!order) {
    return (
      <main dir="rtl">
        <Section>
          <Container size="narrow">
            <EmptyState
              title="تعذر عرض الطلب"
              description="رابط التتبع غير صالح أو انتهت صلاحيته. يرجى إدخال رقم الطلب ورقم الهاتف مرة أخرى."
            />
          </Container>
        </Section>
      </main>
    );
  }

  if (decodeURIComponent(orderNumber) !== order.order_number) {
    notFound();
  }

  return (
    <main>
      <Section>
        <Container size="narrow">
          <OrderTrackingResult order={order} whatsappNumber={settings?.whatsapp_number} />
        </Container>
      </Section>
    </main>
  );
}
