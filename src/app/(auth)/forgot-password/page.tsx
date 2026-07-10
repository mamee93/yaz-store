import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { requestPasswordResetAction } from "@/features/auth/actions";

export const dynamic = "force-dynamic";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="grid min-h-screen place-items-center bg-oud-ivory px-4 py-10" dir="rtl">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-oud bg-oud-brown text-oud-gold">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-oud-brown">
            نسيت كلمة المرور
          </h1>
          <p className="mt-2 text-sm leading-7 text-oud-muted">
            أدخل بريدك الإلكتروني وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.
          </p>
        </div>

        <AuthMessage error={params.error} message={params.message} />

        <form action={requestPasswordResetAction} className="space-y-4">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            placeholder="name@example.com"
            dir="ltr"
            required
          />
          <Button type="submit" className="w-full" size="lg">
            إرسال رابط الاستعادة
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-oud-muted">
          تذكرت كلمة المرور؟{" "}
          <Link href="/login" className="font-semibold text-oud-brown hover:text-oud-gold">
            العودة إلى تسجيل الدخول
          </Link>
        </p>
      </Card>
    </section>
  );
}

function AuthMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <div className="mb-5 rounded-oud border border-red-900/15 bg-red-900/10 p-3 text-sm leading-6 text-red-900">
        {error}
      </div>
    );
  }

  if (message) {
    return (
      <div className="mb-5 rounded-oud border border-green-900/15 bg-green-900/10 p-3 text-sm leading-6 text-green-900">
        {message}
      </div>
    );
  }

  return null;
}
