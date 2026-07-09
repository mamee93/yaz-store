import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { registerCustomerAction } from "@/features/auth/actions";
import { getCurrentCustomer } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const customer = await getCurrentCustomer();

  if (customer) {
    redirect("/account");
  }

  const params = await searchParams;

  return (
    <section className="grid min-h-screen place-items-center bg-oud-ivory px-4 py-10" dir="rtl">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-oud bg-oud-brown text-oud-gold">
            <UserPlus className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-oud-brown">
            إنشاء حساب
          </h1>
          <p className="mt-2 text-sm leading-7 text-oud-muted">
            أنشئ حسابك لحفظ بياناتك ومتابعة طلباتك بسهولة.
          </p>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-oud border border-red-900/15 bg-red-900/10 p-3 text-sm leading-6 text-red-900">
            {params.error}
          </div>
        ) : null}

        <form action={registerCustomerAction} className="space-y-4">
          <Input label="الاسم الكامل" name="fullName" placeholder="مثال: أحمد الهاشمي" required />
          <Input label="رقم الهاتف" name="phone" type="tel" placeholder="9XXXXXXX" required />
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="name@example.com"
            dir="ltr"
            required
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="6 أحرف على الأقل"
            dir="ltr"
            required
          />
          <Button type="submit" className="w-full" size="lg">
            إنشاء الحساب
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-oud-muted">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-oud-brown hover:text-oud-gold">
            تسجيل الدخول
          </Link>
        </p>
      </Card>
    </section>
  );
}
