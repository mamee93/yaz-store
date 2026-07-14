import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CustomerDeliveryFields } from "@/components/customer/customer-delivery-fields";
import { Badge, Button, Card, Container, Heading, Input, Section } from "@/components/ui";
import { updateCustomerProfileAction } from "@/features/customers/actions";
import { getCustomerAccountOverview } from "@/features/customers/queries";

export const dynamic = "force-dynamic";

type AccountProfilePageProps = {
  searchParams: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function AccountProfilePage({ searchParams }: AccountProfilePageProps) {
  const [params, overview] = await Promise.all([searchParams, getCustomerAccountOverview()]);

  if (!overview) {
    redirect("/login?message=يرجى تسجيل الدخول لتحديث بياناتك.");
  }

  const profile = overview.profile;

  return (
    <main dir="rtl">
      <Section>
        <Container className="space-y-6">
          <Heading
            level={1}
            eyebrow="حسابي"
            description="حدّث بياناتك الأساسية وبيانات التوصيل الافتراضية المستخدمة في الطلبات القادمة."
          >
            بياناتي
          </Heading>
          <StatusMessage status={params.status} message={params.message} />

          <Card className="p-5 shadow-none">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-oud-brown">تعديل الملف الشخصي</h2>
                <p className="mt-1 text-sm text-oud-muted">البريد الإلكتروني للعرض فقط حاليًا.</p>
              </div>
              <Badge variant={overview.deliveryProfileComplete ? "success" : "gold"}>
                {overview.deliveryProfileComplete ? "البيانات مكتملة" : "البيانات غير مكتملة"}
              </Badge>
            </div>

            <form action={updateCustomerProfileAction} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="الاسم الكامل"
                  name="full_name"
                  defaultValue={profile?.full_name ?? ""}
                  required
                />
                <Input
                  label="البريد الإلكتروني"
                  value={profile?.email ?? ""}
                  readOnly
                  dir="ltr"
                  className="bg-oud-beige/25"
                />
              </div>
              <CustomerDeliveryFields
                phone={profile?.phone}
                governorate={profile?.governorate}
                wilayat={profile?.wilayat}
                area={profile?.area}
                detailedAddress={profile?.detailed_address}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit">حفظ البيانات</Button>
                <Link
                  href="/account"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-oud border border-oud-brown/20 bg-oud-pearl px-5 text-sm font-semibold text-oud-brown"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                  العودة للحساب
                </Link>
              </div>
            </form>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

function StatusMessage({ status, message }: { status?: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={
        status === "error"
          ? "rounded-oud border border-red-900/15 bg-red-900/10 px-4 py-3 text-sm font-semibold text-red-900"
          : "rounded-oud border border-green-900/15 bg-green-900/10 px-4 py-3 text-sm font-semibold text-green-900"
      }
    >
      {message}
    </div>
  );
}
