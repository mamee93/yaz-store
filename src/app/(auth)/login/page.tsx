import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { loginAction } from "@/features/auth/actions";
import { getCurrentAdmin } from "@/features/auth/queries";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <section className="grid min-h-screen place-items-center bg-oud-ivory px-4 py-10">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-oud bg-oud-brown text-oud-gold">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-oud-brown">
            دخول الإدارة
          </h1>
          <p className="mt-2 text-sm leading-7 text-oud-muted">
            سجّل الدخول بحساب إداري مفعّل في عود ياز.
          </p>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-oud border border-red-900/15 bg-red-900/10 p-3 text-sm leading-6 text-red-900">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="mb-5 rounded-oud border border-green-900/15 bg-green-900/10 p-3 text-sm leading-6 text-green-900">
            {params.message}
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="admin@example.com"
            dir="ltr"
            required
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            placeholder="••••••••"
            dir="ltr"
            required
          />
          <Button type="submit" className="w-full" size="lg">
            تسجيل الدخول
          </Button>
        </form>
      </Card>
    </section>
  );
}
